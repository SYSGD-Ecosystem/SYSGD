import { Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { getCurrentUserData } from "../controllers/users";
import { createDefaultUserData } from "../utils/billing";
import {
  consumeCreditsByPriority,
  maybeRenewPlanCredits,
  normalizeBillingState,
  persistBilling,
} from "../services/billing-credits.service";

// ============================================
// INTERFACES
// ============================================

interface BillingLimits {
  max_projects: number;
  max_documents: number;
  max_task_per_projects: number;
  max_team_members: number;
  github_integration: boolean;
  bank_ideas: boolean;
  chat: boolean;
  custom_gemini_token?: boolean;
  priority_support: boolean;
}

interface BillingData {
  tier: "free" | "pro" | "vip";
  ai_task_credits: number;
  purchased_credits: number;
  limits: BillingLimits;
  billing_cycle: {
    last_reset: string;
    next_reset: string;
  };
}

interface UserData {
  billing: BillingData;
  custom_tokens?: {
    gemini?: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  privileges: string;
  user_data: UserData;
}

// ============================================
// HELPER: OBTENER DATOS DE BILLING DEL USUARIO
// ============================================

async function getUserBillingData(userId: string): Promise<UserData | null> {
	try {
		const { rows } = await pool.query(
			"SELECT user_data FROM users WHERE id = $1",
			[userId]
		);

		if (rows.length === 0) return null;

		const userData = rows[0].user_data as UserData | null;

		if (!userData || !userData.billing || !userData.billing.limits) {
			const fallback = createDefaultUserData();
			await pool.query(
				"UPDATE users SET user_data = $1 WHERE id = $2",
				[JSON.stringify(fallback), userId],
			);
			return fallback as UserData;
		}

		const normalized = maybeRenewPlanCredits(normalizeBillingState(userData.billing));
		if (JSON.stringify(normalized) !== JSON.stringify(userData.billing)) {
			await persistBilling(userId, normalized);
		}

		return {
			...userData,
			billing: normalized,
		};
	} catch (error) {
		console.error("Error obteniendo datos de billing:", error);
		return null;
	}
}

// ============================================
// MIDDLEWARE: VERIFICAR CRÉDITOS AI
// ============================================

/**
 * Middleware para verificar si el usuario tiene créditos disponibles
 * Si no tiene créditos pero tiene token custom, permite continuar
 */
export async function checkAICredits(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = getCurrentUserData(req);

  if (!user) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  try {
    const userData = await getUserBillingData(user.id);

    if (!userData) {
      res.status(400).json({ error: "Error al obtener datos de facturación" });
      return;
    }

    const billing = userData.billing;
    const hasCredits = billing.ai_task_credits > 0;

    const requestProvider = typeof req.body?.provider === "string"
      ? req.body.provider.toLowerCase()
      : undefined;

    let tokenType: "gemini" | "openrouter" =
      req.baseUrl.includes("/openrouter") || requestProvider === "openrouter"
        ? "openrouter"
        : "gemini";

    if (req.baseUrl.includes("/agents") && req.body?.agent_id) {
      const agentRow = await pool.query(
        "SELECT url FROM agents WHERE id = $1 AND created_by = $2",
        [req.body.agent_id, user.id]
      );

      if (agentRow.rows.length > 0) {
        const agentUrl = String(agentRow.rows[0].url || "").toLowerCase();
        tokenType = agentUrl.includes("/api/openrouter") ? "openrouter" : "gemini";
      }
    }

    // Verificar si tiene token custom en user_tokens
    const { rows: tokenRows } = await pool.query(
      "SELECT encrypted_token, iv FROM user_tokens WHERE user_id = $1 AND token_type = $2",
      [user.id, tokenType]
    );

    const hasCustomToken = tokenRows.length > 0;

    // Prioridad: si tiene token custom, SIEMPRE usar ese token primero
    if (hasCustomToken) {
      // Importar TokenService para desencriptar
      const { TokenService } = await import("../services/token.service");
      const decryptedToken = TokenService.decryptToken(
        tokenRows[0].encrypted_token,
        tokenRows[0].iv,
        tokenType
      );

      (req as any).useCustomToken = true;
      (req as any).customToken = decryptedToken;
      (req as any).billingData = billing;
      next();
      return;
    }

    // Si no tiene token custom, usar créditos del sistema
    if (hasCredits) {
      (req as any).useCustomToken = false;
      (req as any).billingData = billing;
      next();
      return;
    }

    // No tiene créditos ni token custom
    res.status(402).json({
      error: "Créditos insuficientes",
      message: `No tienes créditos disponibles. Puedes comprar más o configurar tu propio token de ${tokenType === "openrouter" ? "OpenRouter" : "Gemini"}.`,
      credits: {
        available: billing.ai_task_credits,
        purchased: billing.purchased_credits
      }
    });
  } catch (error) {
    console.error("Error verificando créditos:", error);
    res.status(500).json({ error: "Error al verificar créditos" });
  }
}

// ============================================
// MIDDLEWARE: CONSUMIR CRÉDITOS AI
// ============================================

/**
 * Middleware para consumir créditos después de una operación exitosa
 * Se ejecuta DESPUÉS de la operación, no antes
 */
export async function consumeAICredits(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = getCurrentUserData(req);
  const useCustomToken = (req as any).useCustomToken;

  // Si usa token custom, no consumir créditos
  if (useCustomToken || !user) {
    next();
    return;
  }

  try {
    // Consumir 1 crédito
    await pool.query('BEGIN');

    const { rows } = await pool.query(
      `SELECT user_data FROM users WHERE id = $1 FOR UPDATE`,
      [user.id],
    );

    if (rows.length === 0) {
      await pool.query('ROLLBACK');
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const userData = rows[0].user_data as UserData | null;
    const current = maybeRenewPlanCredits(
      normalizeBillingState(userData?.billing ?? createDefaultUserData().billing),
    );

    const consumed = consumeCreditsByPriority(current, 1);

    if (!consumed) {
      await pool.query('ROLLBACK');
      res.status(402).json({
        error: "Créditos insuficientes",
        message: "No quedan créditos disponibles para consumir",
      });
      return;
    }

    await persistBilling(user.id, consumed);
    await pool.query('COMMIT');

    (req as any).creditConsumption = {
      fromPriority: consumed.credit_spending_priority,
      remaining: consumed.ai_task_credits,
    };
    next();
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error consumiendo créditos:", error);
    // No fallar la petición por error de consumo, solo loguearlo
    next();
  }
}

// ============================================
// MIDDLEWARE: VERIFICAR ACCESO A FEATURE
// ============================================

/**
 * Middleware para verificar si el usuario tiene acceso a una feature específica
 */
export function checkFeatureAccess(feature: keyof BillingLimits) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = getCurrentUserData(req);

    if (!user) {
      res.status(401).json({ error: "Usuario no autenticado" });
      return;
    }

    try {
      const userData = await getUserBillingData(user.id);

      if (!userData) {
        res.status(400).json({ error: "Error al obtener datos de facturación" });
        return;
      }

      const hasAccess = userData.billing.limits[feature];

      if (typeof hasAccess === "boolean" && !hasAccess) {
        res.status(403).json({
          error: "Acceso denegado",
          message: `Esta funcionalidad requiere un plan superior. Feature: ${feature}`,
          tier: userData.billing.tier
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Error verificando acceso a feature:", error);
      res.status(500).json({ error: "Error al verificar acceso" });
    }
  };
}

// ============================================
// MIDDLEWARE: VERIFICAR LÍMITE DE PROYECTOS
// ============================================

/**
 * Verifica si el usuario puede crear más proyectos
 */
export async function checkProjectLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = getCurrentUserData(req);

  if (!user) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  try {
    const userData = await getUserBillingData(user.id);

    if (!userData) {
      res.status(400).json({ error: "Error al obtener datos de facturación" });
      return;
    }

    const maxProjects = userData.billing.limits.max_projects;

    // -1 significa ilimitado
    if (maxProjects === -1) {
      next();
      return;
    }

    // Contar proyectos del usuario
    const { rows } = await pool.query(
      "SELECT COUNT(*) as count FROM projects WHERE created_by = $1",
      [user.id]
    );

    const projectCount = parseInt(rows[0].count);

    if (projectCount >= maxProjects) {
      res.status(403).json({
        error: "Límite alcanzado",
        message: `Has alcanzado el límite de ${maxProjects} proyectos para tu plan ${userData.billing.tier}.`,
        current: projectCount,
        limit: maxProjects,
        tier: userData.billing.tier
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error verificando límite de proyectos:", error);
    res.status(500).json({ error: "Error al verificar límite" });
  }
}

// ============================================
// MIDDLEWARE: VERIFICAR LÍMITE DE TAREAS POR PROYECTO
// ============================================

/**
 * Verifica si se pueden agregar más tareas a un proyecto
 */
export async function checkTaskLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = getCurrentUserData(req);
  const projectId = req.params.projectId || req.body.project_id;

  if (!user) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  if (!projectId) {
    res.status(400).json({ error: "ID de proyecto requerido" });
    return;
  }

  try {
    const userData = await getUserBillingData(user.id);

    if (!userData) {
      res.status(400).json({ error: "Error al obtener datos de facturación" });
      return;
    }

    const maxTasks = userData.billing.limits.max_task_per_projects;

    // -1 significa ilimitado
    if (maxTasks === -1) {
      next();
      return;
    }

    // Contar tareas del proyecto
    const { rows } = await pool.query(
      "SELECT COUNT(*) as count FROM tasks WHERE project_id = $1",
      [projectId]
    );

    const taskCount = parseInt(rows[0].count);

    if (taskCount >= maxTasks) {
      res.status(403).json({
        error: "Límite alcanzado",
        message: `Este proyecto ha alcanzado el límite de ${maxTasks} tareas para tu plan ${userData.billing.tier}.`,
        current: taskCount,
        limit: maxTasks,
        tier: userData.billing.tier
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error verificando límite de tareas:", error);
    res.status(500).json({ error: "Error al verificar límite" });
  }
}

// ============================================
// MIDDLEWARE: VERIFICAR LÍMITE DE DOCUMENTOS
// ============================================

/**
 * Verifica si el usuario puede crear más documentos
 */
export async function checkDocumentLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = getCurrentUserData(req);

  if (!user) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  try {
    const userData = await getUserBillingData(user.id);

    if (!userData) {
      res.status(400).json({ error: "Error al obtener datos de facturación" });
      return;
    }

    const maxDocuments = userData.billing.limits.max_documents;

    // -1 significa ilimitado
    if (maxDocuments === -1) {
      next();
      return;
    }

    // Contar documentos del usuario
    const { rows } = await pool.query(
      "SELECT COUNT(*) as count FROM document_management_file WHERE user_id = $1",
      [user.id]
    );

    const documentCount = parseInt(rows[0].count);

    if (documentCount >= maxDocuments) {
      res.status(403).json({
        error: "Límite alcanzado",
        message: `Has alcanzado el límite de ${maxDocuments} documentos para tu plan ${userData.billing.tier}.`,
        current: documentCount,
        limit: maxDocuments,
        tier: userData.billing.tier
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error verificando límite de documentos:", error);
    res.status(500).json({ error: "Error al verificar límite" });
  }
}

// ============================================
// MIDDLEWARE: VERIFICAR LÍMITE DE MIEMBROS DE EQUIPO
// ============================================

/**
 * Verifica si se pueden agregar más miembros a un proyecto
 */
export async function checkTeamMemberLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = getCurrentUserData(req);
  const projectId = req.params.projectId || req.body.project_id || req.body.resource_id;

  if (!user) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  if (!projectId) {
    res.status(400).json({ error: "ID de proyecto requerido" });
    return;
  }

  try {
    const userData = await getUserBillingData(user.id);

    if (!userData) {
      res.status(400).json({ error: "Error al obtener datos de facturación" });
      return;
    }

    const maxMembers = userData.billing.limits.max_team_members;

    // -1 significa ilimitado
    if (maxMembers === -1) {
      next();
      return;
    }

    // Contar miembros del proyecto
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count 
       FROM resource_access 
       WHERE resource_id = $1 
       AND resource_type = 'project'`,
      [projectId]
    );

    const memberCount = parseInt(rows[0].count);

    if (memberCount >= maxMembers) {
      res.status(403).json({
        error: "Límite alcanzado",
        message: `Este proyecto ha alcanzado el límite de ${maxMembers} miembros para tu plan ${userData.billing.tier}.`,
        current: memberCount,
        limit: maxMembers,
        tier: userData.billing.tier
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error verificando límite de miembros:", error);
    res.status(500).json({ error: "Error al verificar límite" });
  }
}

// ============================================
// HELPER: OBTENER RESUMEN DE USO
// ============================================

/**
 * Obtiene un resumen del uso actual del usuario
 */
export async function getUsageSummary(userId: string) {
  try {
    const userData = await getUserBillingData(userId);

    if (!userData) {
      throw new Error("Usuario no encontrado");
    }

    // Obtener conteos actuales
    const [projects, documents, geminiToken, openrouterToken] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM projects WHERE created_by = $1", [userId]),
      pool.query("SELECT COUNT(*) as count FROM document_management_file WHERE user_id = $1", [userId]),
      pool.query("SELECT id FROM user_tokens WHERE user_id = $1 AND token_type = 'gemini'", [userId]),
      pool.query("SELECT id FROM user_tokens WHERE user_id = $1 AND token_type = 'openrouter'", [userId])
    ]);

    const projectCount = parseInt(projects.rows[0].count);
    const documentCount = parseInt(documents.rows[0].count);

    return {
      tier: userData.billing.tier,
      credits: {
        available: userData.billing.ai_task_credits,
        purchased: userData.billing.purchased_credits,
        next_reset: userData.billing.billing_cycle.next_reset
      },
      usage: {
        projects: {
          current: projectCount,
          limit: userData.billing.limits.max_projects,
          percentage: userData.billing.limits.max_projects === -1 
            ? 0 
            : (projectCount / userData.billing.limits.max_projects) * 100
        },
        documents: {
          current: documentCount,
          limit: userData.billing.limits.max_documents,
          percentage: userData.billing.limits.max_documents === -1 
            ? 0 
            : (documentCount / userData.billing.limits.max_documents) * 100
        }
      },
      features: {
        github_integration: userData.billing.limits.github_integration,
        bank_ideas: userData.billing.limits.bank_ideas,
        chat: userData.billing.limits.chat,
        custom_gemini_token: userData.billing.limits.custom_gemini_token || false,
        priority_support: userData.billing.limits.priority_support
      },
      hasCustomToken: geminiToken.rows.length > 0 || openrouterToken.rows.length > 0,
      hasCustomGeminiToken: geminiToken.rows.length > 0,
      hasCustomOpenRouterToken: openrouterToken.rows.length > 0,
    };
  } catch (error) {
    console.error("Error obteniendo resumen de uso:", error);
    throw error;
  }
}
