import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";
import { getCurrentUser } from "../controllers/auth";
import { getUsageSummary } from "../middlewares/usageLimits.middleware";
import { maybeRenewPlanCredits, normalizeBillingState } from "../services/billing-credits.service";

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

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Obtener usuario actual
router.get("/me", getCurrentUser);

// Registro de nuevo usuario (primero se vuelve admin)
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }

  try {
    // Verificar si es el primer usuario (será admin)
    const { rows: existingUsers } = await pool.query("SELECT COUNT(*) FROM users");
    const isFirstUser = parseInt(existingUsers[0].count) === 0;
    
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, privileges, status, user_data) 
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, 'active', $5) 
       RETURNING id, name, email, privileges, status, user_data`,
      [name, email, password, isFirstUser ? "admin" : "user", JSON.stringify(DEFAULT_USER_DATA)]
    );

    res.status(201).json(rows[0]);
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
      credits: {
        available: billing.ai_task_credits || 0,
        plan: billing.plan_credits || 0,
        purchased: billing.purchased_credits || 0,
        bonus: (billing.bonus_credits || []).reduce((acc: number, item: { amount?: number }) => acc + (item.amount || 0), 0),
        next_reset: billing.billing_cycle?.next_reset
      },
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
router.put("/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, email, privileges, status, user_data } = req.body;

  if (!userId) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    // Construir query dinámicamente
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    if (privileges !== undefined) {
      updates.push(`privileges = $${paramIndex++}`);
      values.push(privileges);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (user_data !== undefined) {
      // Obtener user_data actual para hacer merge
      const { rows: currentRows } = await pool.query(
        "SELECT user_data FROM users WHERE id = $1",
        [userId]
      );

      if (currentRows.length === 0) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      const currentUserData = currentRows[0].user_data || DEFAULT_USER_DATA;
      const mergedUserData = {
        ...currentUserData,
        ...user_data,
        billing: {
          ...currentUserData.billing,
          ...(user_data.billing || {})
        }
      };

      updates.push(`user_data = $${paramIndex++}`);
      values.push(JSON.stringify(mergedUserData));
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "No hay datos para actualizar" });
      return;
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(", ")} 
       WHERE id = $${paramIndex} 
       RETURNING id, name, email, privileges, status, user_data`,
      values
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// Actualizar plan del usuario (admin)
router.put("/:id/plan", async (req, res) => {
  const { tier, credits } = req.body;
  const userId = req.params.id;
  
  if (!['free', 'pro', 'vip'].includes(tier) && typeof credits !== 'number') {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    // Obtener user_data actual
    const { rows: currentRows } = await pool.query(
      "SELECT user_data FROM users WHERE id = $1",
      [userId]
    );

    if (currentRows.length === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const currentUserData = currentRows[0].user_data || DEFAULT_USER_DATA;
    
    // Actualizar tier y/o créditos
    const updatedBilling = {
      ...currentUserData.billing,
      ...(tier && { tier, limits: TIER_LIMITS[tier as keyof typeof TIER_LIMITS] }),
      ...(credits !== undefined && { plan_credits: credits })
    };

    updatedBilling.ai_task_credits = (updatedBilling.plan_credits || 0) + (updatedBilling.purchased_credits || 0) + ((updatedBilling.bonus_credits || []).reduce((acc: number, item: { amount?: number }) => acc + (item.amount || 0), 0));

    const updatedUserData = {
      ...currentUserData,
      billing: updatedBilling
    };

    const { rows } = await pool.query(
      `UPDATE users 
       SET user_data = $1
       WHERE id = $2
       RETURNING id, user_data`,
      [JSON.stringify(updatedUserData), userId]
    );

    res.json({
      message: "Plan actualizado correctamente",
      billing: rows[0].user_data.billing
    });
  } catch (error) {
    console.error("Error al actualizar el plan:", error);
    res.status(500).json({ error: "Error al actualizar el plan" });
  }
});

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

  if (!userId) {
    res.status(400).json({ error: "ID inválido" });
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