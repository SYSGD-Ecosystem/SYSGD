import { Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { getCurrentUserData } from "../controllers/users";

interface UsageLimits {
  max_projects?: number;
  max_documents?: number;
  max_task_per_projects?: number;
  max_team_members?: number;
  [key: string]: any;
}

export async function checkUsageLimit(limitName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = getCurrentUserData(req);
    if (!user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {
      // Obtener datos actuales del usuario
      const { rows } = await pool.query(
        "SELECT user_data FROM users WHERE id = $1",
        [user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const userData = rows[0].user_data || {};
      const { tier, limits = {} } = userData.billing || {};

      // Si es VIP, no hay límites
      if (tier === "vip") return next();

      // Verificar si la acción requiere créditos de IA
      const isAICreditAction = ["ai_generation", "ai_chat"].includes(limitName);
      
      if (isAICreditAction) {
        const currentCredits = userData.billing?.ai_task_credits || 0;
        if (currentCredits <= 0) {
          return res.status(403).json({
            error: "Créditos de IA insuficientes",
            code: "INSUFFICIENT_CREDITS",
            required: 1,
            available: currentCredits
          });
        }
        return next();
      }

      // Verificar límites específicos
      const limit = limits[limitName];
      if (limit === undefined) return next();

      // Contar el recurso actual
      let currentCount;
      switch (limitName) {
        case "max_projects":
          const projects = await pool.query(
            "SELECT COUNT(*) FROM projects WHERE user_id = $1",
            [user.id]
          );
          currentCount = parseInt(projects.rows[0].count, 10);
          break;

        case "max_team_members":
          // Verificar si es una acción de proyecto
          const projectId = req.params.projectId || req.body.projectId;
          if (!projectId) {
            return next();
          }

          // Obtener el conteo actual de miembros del proyecto
          const members = await pool.query(
            `SELECT COALESCE(pmc.member_count, 0) as count
             FROM projects p
             LEFT JOIN project_member_counts pmc ON p.id = pmc.project_id
             WHERE p.id = $1`,
            [projectId]
          );
          
          currentCount = parseInt(members.rows[0]?.count || '0', 10);
          break;

        default:
          return next();
      }

      if (currentCount >= limit) {
        return res.status(403).json({
          error: `Límite de ${limitName} alcanzado`,
          limit,
          current: currentCount
        });
      }

      next();
    } catch (error) {
      console.error("Error en checkUsageLimit:", error);
      return res.status(500).json({ error: "Error al verificar límites de uso" });
    }
  };
}

export async function consumeAICredits(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = getCurrentUserData(req);
  if (!user) return next();

  try {
    // Verificar si el usuario está usando un token personalizado
    const usingCustomToken = req.headers['x-ai-token-type'] === 'custom';
    
    // Si usa token personalizado, no consumir créditos
    if (usingCustomToken) {
      return next();
    }

    // Iniciar transacción
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Bloquear la fila del usuario
      const { rows } = await client.query(
        `SELECT 
           user_data->'billing' as billing,
           user_data->'custom_tokens' as custom_tokens
         FROM users 
         WHERE id = $1 
         FOR UPDATE`,
        [user.id]
      );

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return next();
      }

      const userData = rows[0];
      const billing = userData.billing || {};
      const customTokens = userData.custom_tokens || {};
      
      // No descontar créditos a usuarios VIP o si tienen token personalizado
      if (billing.tier === "vip" || customTokens.gemini) {
        await client.query('COMMIT');
        return next();
      }

      // Verificar si hay créditos disponibles
      const currentCredits = billing.ai_task_credits || 0;
      if (currentCredits <= 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: "Créditos de IA insuficientes",
          code: "INSUFFICIENT_CREDITS",
          required: 1,
          available: 0
        });
      }

      // Actualizar créditos
      const updatedCredits = currentCredits - 1;
      
      await client.query(
        `UPDATE users 
         SET user_data = jsonb_set(
           COALESCE(user_data, '{}'::jsonb),
           '{billing,ai_task_credits}',
           to_jsonb($1::int)
         )
         WHERE id = $2`,
        [updatedCredits, user.id]
      );

      await client.query('COMMIT');
      
      // Agregar encabezado con créditos restantes
      res.set('X-AI-Credits-Remaining', updatedCredits.toString());
      
      next();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al consumir créditos de IA:", error);
    // Continuar sin bloquear en caso de error
    next();
  }
}

export function checkTierAccess(allowedTiers: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getCurrentUserData(req);
    if (!user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Obtener el tier del usuario
    const userTier = user.user_data?.billing?.tier || "free";
    
    if (!allowedTiers.includes(userTier)) {
      return res.status(403).json({
        error: "Esta función no está disponible en tu plan actual",
        code: "TIER_NOT_ALLOWED",
        requiredTier: allowedTiers[0],
        currentTier: userTier
      });
    }

    next();
  };
}
