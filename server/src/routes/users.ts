import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData, updateAdminUser, updateAdminUserPlan } from "../controllers/users";
import { getCurrentUser } from "../controllers/auth";
import { getUsageSummary } from "../middlewares/usageLimits.middleware";
import { activatePlanBilling, maybeRenewPlanCredits, normalizeBillingState } from "../services/billing-credits.service";
import { getClientIp, isIpFromCuba } from "../utils/ip";
import { registerIpRateLimit } from "../middlewares/rate-limit";
import { isContabilidadSource, normalizeClientSource } from "../utils/client-source";
import { EmailVerificationService } from "../services/emailVerification.service";
import { createDefaultUserData } from "../utils/billing";

const router = Router();

// ============================================
// TIPOS Y CONSTANTES
// ============================================

const DEFAULT_USER_DATA = {
  billing: {
    tier: "free",
    ai_task_credits: 10,
    plan_credits: 10,
    purchased_credits: 0,
    bonus_credits: [],
    credit_spending_priority: ["bonus", "plan", "purchased"],
    limits: {
      max_projects: 3,
      max_documents: 5,
      max_task_per_projects: 250,
      max_team_members: 10,
      github_integration: false,
      bank_ideas: false,
      chat: false,
      custom_gemini_token: true,
      priority_support: false
    },
    billing_cycle: {
      last_reset: new Date().toISOString(),
      next_reset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
};

const TIER_LIMITS = {
  free: {
    max_projects: 3,
    max_documents: 5,
    max_task_per_projects: 250,
    max_team_members: 10,
    github_integration: false,
    bank_ideas: false,
    chat: false,
    priority_support: false
  },
  pro: {
    max_projects: -1,
    max_documents: -1,
    max_task_per_projects: -1,
    max_team_members: -1,
    github_integration: true,
    bank_ideas: true,
    chat: true,
    priority_support: false
  },
  vip: {
    max_projects: -1,
    max_documents: -1,
    max_task_per_projects: -1,
    max_team_members: -1,
    github_integration: true,
    bank_ideas: true,
    chat: true,
    priority_support: true
  }
};

type AndroidDistribution = "freemium" | "apklis" | "unknown";

const normalizeAndroidDistribution = (
  rawDistribution: unknown,
  rawPackage: unknown,
): AndroidDistribution => {
  const distribution = Array.isArray(rawDistribution) ? rawDistribution[0] : rawDistribution;
  const normalizedDistribution =
    typeof distribution === "string" ? distribution.split(",")[0].trim().toLowerCase() : "";

  if (normalizedDistribution === "freemium") return "freemium";
  if (normalizedDistribution === "apklis" || normalizedDistribution === "paid") return "apklis";

  const packageName = Array.isArray(rawPackage) ? rawPackage[0] : rawPackage;
  const normalizedPackage =
    typeof packageName === "string" ? packageName.split(",")[0].trim().toLowerCase() : "";

  if (normalizedPackage.endsWith(".freemium")) return "freemium";
  if (normalizedPackage.startsWith("cu.lazaroysr96.sysgdcont")) return "apklis";

  return "unknown";
};

const buildRegistrationUserData = (
  registrationSource: string,
  distribution: AndroidDistribution,
) => {
  const defaultUserData = createDefaultUserData();

  if (registrationSource === "sysgd_cont_android") {

    if(distribution === "apklis"){
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const trialBilling = activatePlanBilling(defaultUserData.billing, "pro", 1, now);

    return {
      ...defaultUserData,
      billing: {
        ...trialBilling,
        billing_cycle: {
          ...trialBilling.billing_cycle,
          next_reset: expiresAt,
        },
        plan_validity: trialBilling.plan_validity
          ? {
              ...trialBilling.plan_validity,
              expires_at: expiresAt,
            }
          : trialBilling.plan_validity,
      },
    };
  }else{
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const trialBilling = activatePlanBilling(defaultUserData.billing, "pro", 1, now);

    return {
      ...defaultUserData,
      billing: {
        ...trialBilling,
        billing_cycle: {
          ...trialBilling.billing_cycle,
          next_reset: expiresAt,
        },
        plan_validity: trialBilling.plan_validity
          ? {
              ...trialBilling.plan_validity,
              expires_at: expiresAt,
            }
          : trialBilling.plan_validity,
      },
    };
  }
  }

  return defaultUserData;
};

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Obtener usuario actual
router.get("/me", getCurrentUser);

// Registro de nuevo usuario (primero se vuelve admin)
router.post("/register", registerIpRateLimit, async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }

  // Verificar origen del registro (sysgd-cont vs plataforma principal)
  const registrationSource = normalizeClientSource(req.headers["x-app-source"], "unknown");
  const isFromSysgdCont = isContabilidadSource(registrationSource);
  const androidDistribution = normalizeAndroidDistribution(
    req.headers["x-app-distribution"],
    req.headers["x-app-package"],
  );
  const registrationUserData = buildRegistrationUserData(registrationSource, androidDistribution);
  const grantedPlan =
    registrationSource === "sysgd_cont_android" && androidDistribution === "apklis"
      ? { tier: "pro", durationDays: 30, reason: "android_apklis_trial" }
      : null;

  // Validar IP solo para sysgd-cont
  if (isFromSysgdCont) {
    const clientIp = getClientIp(req);
    if (!isIpFromCuba(clientIp)) {
      res.status(403).json({ 
        error: "Servicio disponible solo para Cuba",
        message: "Este servicio de contabilidad está disponible exclusivamente para usuarios en Cuba. Si estás usando una VPN, por favor desactívala antes de intentar crear una cuenta."
      });
      return;
    }
  }

  try {
    // Verificar si es el primer usuario (será admin)
    const { rows: existingUsers } = await pool.query("SELECT COUNT(*) FROM users");
    const isFirstUser = parseInt(existingUsers[0].count) === 0;
    
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, privileges, status, user_data, registration_source, registration_meta) 
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, 'active', $5, $6, $7) 
       RETURNING id, name, email, privileges, status, user_data, registration_source`,
      [
        name,
        email,
        password,
        isFirstUser ? "admin" : "user",
        JSON.stringify(registrationUserData),
        registrationSource,
        JSON.stringify({
          rawSourceHeader: req.headers["x-app-source"] ?? null,
          rawDistributionHeader: req.headers["x-app-distribution"] ?? null,
          rawPackageHeader: req.headers["x-app-package"] ?? null,
          androidDistribution,
          grantedPlan,
        }),
      ]
    );

    const verificationResult = await EmailVerificationService.issueVerificationEmail(rows[0].id);

    res.status(201).json({
      ...rows[0],
      emailVerification: {
        sent: verificationResult.ok,
        verified: false,
      },
    });
  } catch (e: any) {
    if (e.code === "23505") {
      res.status(409).json({ error: "El email ya está registrado" });
    } else {
      console.error("Error al registrar usuario:", e);
      res.status(500).json({ error: "Error al crear usuario" });
    }
  }
});

// Usuarios públicos
router.get("/public-users", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, email FROM users WHERE is_public = true"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios públicos:", error);
    res.status(500).json({ error: "Error al obtener usuarios públicos" });
  }
});

// ============================================
// RUTAS AUTENTICADAS
// ============================================
router.use(isAuthenticated);

// Obtener datos completos del usuario actual
router.get("/data", async (req, res) => {
  const user = getCurrentUserData(req);
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  try {
    const { rows } = await pool.query(
      "SELECT user_data FROM users WHERE id = $1",
      [user.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Datos de usuario no encontrados" });
      return;
    }

    const userData = rows[0].user_data || DEFAULT_USER_DATA;
    const billing = maybeRenewPlanCredits(normalizeBillingState(userData.billing));
    res.json({ ...userData, billing });
  } catch (error) {
    console.error("Error al obtener datos de usuario:", error);
    res.status(500).json({ error: "Error al obtener datos de usuario" });
  }
});

// Obtener información del plan actual
router.get("/plan", async (req, res) => {
  const user = getCurrentUserData(req);
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  try {
    const { rows } = await pool.query(
      "SELECT user_data FROM users WHERE id = $1",
      [user.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Datos de usuario no encontrados" });
      return;
    }

    const userData = rows[0].user_data || DEFAULT_USER_DATA;
    const billing = maybeRenewPlanCredits(normalizeBillingState(userData.billing || DEFAULT_USER_DATA.billing));

    res.json({
      tier: billing.tier || 'free',
      hasActivePlan: billing.tier !== "free" && !!billing.plan_validity?.expires_at,
      credits: {
        available: billing.ai_task_credits || 0,
        plan: billing.plan_credits || 0,
        purchased: billing.purchased_credits || 0,
        bonus: (billing.bonus_credits || []).reduce((acc: number, item: { amount?: number }) => acc + (item.amount || 0), 0),
        next_reset: billing.billing_cycle?.next_reset
      },
      planValidity: billing.plan_validity
        ? {
            startedAt: billing.plan_validity.started_at,
            expiresAt: billing.plan_validity.expires_at,
            durationMonths: billing.plan_validity.duration_months,
          }
        : null,
      limits: billing.limits || TIER_LIMITS.free,
      spending_priority: billing.credit_spending_priority || ["bonus", "plan", "purchased"],
      hasCustomToken: !!userData.custom_tokens?.gemini
    });
  } catch (error) {
    console.error("Error al obtener información del plan:", error);
    res.status(500).json({ error: "Error al obtener información del plan" });
  }
});

// Actualizar visibilidad pública
router.put("/public", async (req, res) => {
  const user = getCurrentUserData(req);
  const userId = user?.id;
  const { isPublic } = req.body;

  if (!userId || typeof isPublic !== "boolean") {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    const result = await pool.query(
      "UPDATE users SET is_public = $1 WHERE id = $2 RETURNING id",
      [isPublic, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json({ message: "Visibilidad actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar visibilidad:", error);
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// Agregar esta ruta al archivo users.routes.ts existente



// ... después de las rutas autenticadas y antes de las rutas de admin

/**
 * Obtener resumen de uso actual del usuario
 * Muestra créditos, límites y uso actual de recursos
 */
router.get("/usage", async (req, res) => {
  const user = getCurrentUserData(req);

  if (!user) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  try {
    const summary = await getUsageSummary(user.id);
    res.json(summary);
  } catch (error) {
    console.error("Error obteniendo resumen de uso:", error);
    res.status(500).json({ error: "Error al obtener resumen de uso" });
  }
});

router.put('/me/credit-priority', async (req, res) => {
  const user = getCurrentUserData(req);
  if (!user) {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }

  const { priority } = req.body as { priority?: string[] };
  const valid = Array.isArray(priority)
    && priority.length === 3
    && new Set(priority).size === 3
    && priority.includes('bonus')
    && priority.includes('plan')
    && priority.includes('purchased');

  if (!valid) {
    res.status(400).json({ error: 'Prioridad inválida' });
    return;
  }

  try {
    const { rows } = await pool.query('SELECT user_data FROM users WHERE id = $1', [user.id]);
    const userData = rows[0]?.user_data || DEFAULT_USER_DATA;
    const billing = maybeRenewPlanCredits(normalizeBillingState(userData.billing));
    billing.credit_spending_priority = priority as ("bonus" | "plan" | "purchased")[];

    await pool.query(
      `UPDATE users SET user_data = jsonb_set(COALESCE(user_data, '{}'::jsonb), '{billing}', $1::jsonb) WHERE id = $2`,
      [JSON.stringify(billing), user.id],
    );

    res.json({ message: 'Prioridad actualizada', priority: billing.credit_spending_priority });
  } catch (error) {
    console.error('Error actualizando prioridad:', error);
    res.status(500).json({ error: 'Error al actualizar prioridad' });
  }
});


// ============================================
// RUTAS DE ADMINISTRADOR
// ============================================

// Middleware para verificar privilegios de admin
router.use((req, res, next) => {
  const user = getCurrentUserData(req);
  if (user?.privileges !== "admin") {
    res.status(403).json({ error: "No autorizado" });
    return;
  }
  next();
});

// Listar todos los usuarios
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, privileges, status, is_public, user_data, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Crear usuario (admin)
router.post("/", async (req, res) => {
  const { name, email, password, privileges, status, user_data } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Faltan datos obligatorios" });
    return;
  }

  try {
    // Merge user_data con valores por defecto
    const finalUserData = {
      ...DEFAULT_USER_DATA,
      ...user_data,
      billing: {
        ...DEFAULT_USER_DATA.billing,
        ...(user_data?.billing || {})
      }
    };

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, privileges, status, user_data) 
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, $5, $6) 
       RETURNING id, name, email, privileges, status, user_data`,
      [
        name, 
        email, 
        password, 
        privileges || "user", 
        status || "active",
        JSON.stringify(finalUserData)
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e.code === "23505") {
      res.status(409).json({ error: "El usuario ya existe" });
    } else {
      console.error("Error al crear usuario:", e);
      res.status(500).json({ error: "Error al crear usuario" });
    }
  }
});

// Actualizar usuario (admin) - MEJORADO
router.put("/:id", updateAdminUser);

// Actualizar plan del usuario (admin)
router.put("/:id/plan", updateAdminUserPlan);

// Agregar créditos (admin)
router.post("/:id/credits", async (req, res) => {
  const { amount, isPurchase = false, isBonus = false, bonusExpiresAt } = req.body;
  const userId = req.params.id;
  
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: "Cantidad de créditos inválida" });
    return;
  }

  try {
    await pool.query('BEGIN');
    
    const { rows } = await pool.query(
      `SELECT user_data FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );

    if (rows.length === 0) {
      await pool.query('ROLLBACK');
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const userData = rows[0].user_data || DEFAULT_USER_DATA;
    const billing = maybeRenewPlanCredits(normalizeBillingState(userData.billing || DEFAULT_USER_DATA.billing));

    if (isBonus) {
      if (!bonusExpiresAt || Number.isNaN(new Date(bonusExpiresAt).getTime())) {
        await pool.query('ROLLBACK');
        res.status(400).json({ error: "Para bonos debes indicar una fecha de expiración válida" });
        return;
      }
      billing.bonus_credits = [
        ...billing.bonus_credits,
        { id: `bonus_${Date.now()}`, amount, expires_at: new Date(bonusExpiresAt).toISOString(), source: 'admin' }
      ];
    } else if (isPurchase) {
      billing.purchased_credits += amount;
    } else {
      billing.plan_credits += amount;
    }

    billing.ai_task_credits = billing.plan_credits + billing.purchased_credits + billing.bonus_credits.reduce((acc, item) => acc + item.amount, 0);

    const updatedUserData = {
      ...userData,
      billing,
    };

    await pool.query(
      `UPDATE users SET user_data = $1 WHERE id = $2`,
      [JSON.stringify(updatedUserData), userId]
    );

    await pool.query('COMMIT');
    
    res.json({
      message: "Créditos agregados correctamente",
      added: amount,
      total: billing.ai_task_credits,
      plan: billing.plan_credits,
      purchased: billing.purchased_credits,
      bonus: billing.bonus_credits.reduce((acc, item) => acc + item.amount, 0)
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error al agregar créditos:", error);
    res.status(500).json({ error: "Error al agregar créditos" });
  }
});


// Actualizar contraseña (admin)
router.put("/:id/password", async (req, res) => {
  const userId = req.params.id;
  const { password } = req.body;

  if (!userId || !password) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2 RETURNING id",
      [hashed, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    res.status(500).json({ error: "Error al actualizar contraseña" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = req.params.id;
  const currentUser = getCurrentUserData(req);

  if (!userId) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  if (!currentUser?.id) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  if (currentUser.privileges !== "admin" && currentUser.id !== userId) {
    res.status(403).json({ error: "No autorizado para eliminar este usuario" });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM document_management_file WHERE user_id = $1",
      [userId]
    );

    await client.query(
      "DELETE FROM users_logins WHERE user_id = $1",
      [userId]
    );

    await client.query(
      "DELETE FROM task_assignees WHERE user_id = $1",
      [userId]
    );

    const result = await client.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [userId]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    await client.query("COMMIT");
    res.json({ message: "Usuario eliminado correctamente" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  } finally {
    client.release();
  }
});


export default router;
