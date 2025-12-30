import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData, getUsers, register } from "../controllers/users";
import { getCurrentUser } from "../controllers/auth";
import { checkUsageLimit, consumeAICredits, checkTierAccess } from "../middlewares/usageLimits";

const router = Router();

// Current user data
router.get("/me", getCurrentUser);

// Register new user (first becomes admin)
router.post("/register", register);

router.get("/public-users", async (req, res) => {
	const { rows } = await pool.query(
		"SELECT id, name, email FROM users WHERE is_public = true",
	);
	res.json(rows);
});

// ---- Admin only CRUD ----
router.use(isAuthenticated);

// Obtener información del plan actual
router.get("/plan", async (req, res) => {
  const user = getCurrentUserData(req);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT user_data->'billing' as billing, user_data->'custom_tokens' as custom_tokens FROM users WHERE id = $1",
      [user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Datos de usuario no encontrados" });
    }

    res.json({
      tier: rows[0].billing?.tier || 'free',
      credits: {
        available: rows[0].billing?.ai_task_credits || 0,
        purchased: rows[0].billing?.purchased_credits || 0,
        next_reset: rows[0].billing?.billing_cycle?.next_reset
      },
      limits: rows[0].billing?.limits || {},
      hasCustomToken: !!rows[0].custom_tokens?.gemini
    });
  } catch (error) {
    console.error("Error al obtener información del plan:", error);
    res.status(500).json({ error: "Error al obtener información del plan" });
  }
});

// Actualizar plan del usuario (solo admin)
router.put("/:id/plan", async (req, res) => {
  const { tier, credits } = req.body;
  const userId = parseInt(req.params.id, 10);
  
  if (!['free', 'pro', 'vip'].includes(tier) && typeof credits !== 'number') {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users 
       SET user_data = jsonb_set(
         COALESCE(user_data, '{}'::jsonb), 
         '{billing}', 
         COALESCE(user_data->'billing', '{}'::jsonb) || 
         jsonb_build_object(
           'tier', $1,
           'ai_task_credits', COALESCE($2, user_data->'billing'->>'ai_task_credits', '0')::int,
           'purchased_credits', COALESCE(user_data->'billing'->>'purchased_credits', '0')::int,
           'billing_cycle', jsonb_build_object(
             'last_reset', COALESCE(user_data->'billing'->'billing_cycle'->>'last_reset', NOW()::text),
             'next_reset', COALESCE(user_data->'billing'->'billing_cycle'->>'next_reset', (NOW() + interval '1 month')::text)
           ),
           'limits', jsonb_build_object(
             'max_projects', CASE $1 
               WHEN 'free' THEN 3 
               WHEN 'pro' THEN -1 
               WHEN 'vip' THEN -1 
               ELSE 3 
             END,
             'max_documents', CASE $1 
               WHEN 'free' THEN 5 
               WHEN 'pro' THEN -1 
               WHEN 'vip' THEN -1 
               ELSE 5 
             END,
             'max_task_per_projects', CASE $1 
               WHEN 'free' THEN 250 
               WHEN 'pro' THEN -1 
               WHEN 'vip' THEN -1 
               ELSE 250 
             END,
             'max_team_members', CASE $1 
               WHEN 'free' THEN 10 
               WHEN 'pro' THEN -1 
               WHEN 'vip' THEN -1 
               ELSE 10 
             END,
             'github_integration', $1 !== 'free',
             'bank_ideas', $1 !== 'free',
             'chat', $1 !== 'free',
             'custom_gemini_token', true,
             'priority_support', $1 === 'vip'
           )
         )
       )
       WHERE id = $3
       RETURNING id, user_data->'billing' as billing`,
      [tier, credits, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Plan actualizado correctamente",
      billing: rows[0].billing
    });
  } catch (error) {
    console.error("Error al actualizar el plan:", error);
    res.status(500).json({ error: "Error al actualizar el plan" });
  }
});

// Agregar créditos (para compras o bonificaciones)
router.post("/:id/credits", async (req, res) => {
  const { amount, isPurchase = false } = req.body;
  const userId = parseInt(req.params.id, 10);
  
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: "Cantidad de créditos inválida" });
  }

  try {
    // Usamos una transacción para asegurar la consistencia
    await pool.query('BEGIN');
    
    // Bloqueamos la fila del usuario para evitar condiciones de carrera
    const { rows } = await pool.query(
      `SELECT user_data->'billing' as billing FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );

    if (rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const billing = rows[0].billing || {};
    const currentCredits = billing.ai_task_credits || 0;
    const currentPurchased = billing.purchased_credits || 0;

    // Actualizamos los créditos
    const updateQuery = isPurchase
      ? `user_data = jsonb_set(
           jsonb_set(
             user_data, 
             '{billing,ai_task_credits}', 
             to_jsonb(COALESCE((user_data->'billing'->>'ai_task_credits')::int, 0) + $1)
           ),
           '{billing,purchased_credits}',
           to_jsonb(COALESCE((user_data->'billing'->>'purchased_credits')::int, 0) + $1)
         )`
      : `user_data = jsonb_set(
           user_data, 
           '{billing,ai_task_credits}', 
           to_jsonb(COALESCE((user_data->'billing'->>'ai_task_credits')::int, 0) + $1)
         )`;

    await pool.query(
      `UPDATE users SET ${updateQuery} WHERE id = $2`,
      [amount, userId]
    );

    await pool.query('COMMIT');
    
    res.json({
      message: "Créditos agregados correctamente",
      added: amount,
      total: currentCredits + amount,
      purchased: isPurchase ? currentPurchased + amount : currentPurchased
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error al agregar créditos:", error);
    res.status(500).json({ error: "Error al agregar créditos" });
  }
});

// Configurar token personalizado de Gemini
router.put("/tokens/gemini", async (req, res) => {
  const { token } = req.body;
  const user = getCurrentUserData(req);
  
  if (!user) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  if (typeof token !== 'string' || token.trim() === '') {
    return res.status(400).json({ error: "Token inválido" });
  }

  try {
    await pool.query(
      `UPDATE users 
       SET user_data = jsonb_set(
         COALESCE(user_data, '{}'::jsonb),
         '{custom_tokens,gemini}',
         $1::jsonb
       )
       WHERE id = $2`,
      [token, user.id]
    );

    res.json({ message: "Token de Gemini actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el token de Gemini:", error);
    res.status(500).json({ error: "Error al actualizar el token" });
  }
});

// implementacion del sistema de pago, impesar creando datos de usuario para tipo de pan y saldo dosponible (creditos) utilizar de momento la base de datos user, incluir informacion en user_data columna jsonb

// get user data
router.get("/data", async (req, res) => {
	const user = getCurrentUserData(req);
	if (!user) {
		res.status(404).json({ error: "Usuario no encontrado" });
		return;
	}
	try {
		const { rows } = await pool.query(
			"SELECT user_data FROM users WHERE id = $1",
			[user.id],
		);
		if (rows.length === 0) {
			res.status(404).json({ error: "Datos de usuario no encontrados" });
			return;
		}
		res.json(rows[0].user_data);
	} catch (error) {
		res.status(500).json({ error: "Error al obtener datos de usuario" });
	}
});

router.put("/public", async (req, res) => {
	const user = getCurrentUserData(req);
	const userId = user?.id;
	const { isPublic } = req.body;
	if (Number.isNaN(userId) || typeof isPublic !== "boolean") {
		res.status(400).json({ error: "Datos inválidos" });
		return;
	}
	try {
		const result = await pool.query(
			"UPDATE users SET is_public = $1 WHERE id = $2 RETURNING id",
			[isPublic, userId],
		);
		if (result.rowCount === 0) {
			res.status(404).json({ error: "Usuario no encontrado" });
			return;
		}
		res.json({ message: "Usuario actualizado" });
	} catch {
		res.status(500).json({ error: "Error al actualizar" });
	}
});

router.use((req, res, next) => {
	const user = getCurrentUserData(req);
	if (user?.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}
	next();
});

// create user data controller for admin
router.put("/data", async (req, res) => {
	const user = getCurrentUserData(req);
	if (!user) {
		res.status(404).json({ error: "Usuario no encontrado" });
		return;
	}
	try {
		const { rows } = await pool.query(
			"SELECT user_data FROM users WHERE id = $1",
			[user.id],
		);
		if (rows.length === 0) {
			res.status(404).json({ error: "Datos de usuario no encontrados" });
			return;
		}
		const userData = {
			billing: {
				ai_task_credits: 5,
				purchased_credits: 0,
				tier: "free",
				limits: {
					max_projects: 3,
					max_documents: 5,
					max_task_per_projects: 250,
					max_team_members: 10,
					github_integration: true,
					bank_ideas: true,
					chat: true,
					custom_gemini_token: true,
					priority_support: false
				},
				billing_cycle: {
					last_reset: new Date().toISOString(),
					next_reset: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
				}
			},
			custom_tokens: {
				gemini: ""
			}
		};
		const updatedUserData = { ...userData, ...req.body };
		await pool.query("UPDATE users SET user_data = $1 WHERE id = $2", [
			updatedUserData,
			user.id,
		]);
		res.json({ message: "Datos de usuario actualizados" });
	} catch (error) {
		res.status(500).json({ error: "Error al actualizar datos de usuario" });
	}
});

// List users
router.get("/", getUsers);

// Create user
router.post("/", async (req, res) => {
	const { name, email, password, privileges } = req.body;
	if (!name || !email || !password || !privileges) {
		res.status(400).json({ error: "Faltan datos" });
		return;
	}

	try {
		await pool.query(
			"INSERT INTO users (name, email, password, privileges) VALUES ($1,$2,crypt($3, gen_salt('bf')),$4)",
			[name, email, password, privileges],
		);
		res.status(201).send("201");
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (e: any) {
		if (e.code === "23505")
			res.status(409).json({ error: "Usuario ya existe" });
		else res.status(500).json({ error: "Error servidor" });
	}
});

// Update basic data
router.put("/:id", async (req, res) => {
	const userId = Number.parseInt(req.params.id, 10);
	const { name, email } = req.body;
	if (Number.isNaN(userId) || (!name && !email)) {
		res.status(400).json({ error: "Datos inválidos" });
		return;
	}
	try {
		const fields: string[] = [];
		const values: (string | number)[] = [];
		let idx = 1;
		if (name) {
			fields.push(`name = $${idx++}`);
			values.push(name);
		}
		if (email) {
			fields.push(`email = $${idx++}`);
			values.push(email);
		}
		values.push(userId);
		const result = await pool.query(
			`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id`,
			values,
		);
		if (result.rowCount === 0) {
			res.status(404).json({ error: "Usuario no encontrado" });
			return;
		}
		res.json({ message: "Usuario actualizado" });
	} catch {
		res.status(500).json({ error: "Error al actualizar" });
	}
});

// Update password
router.put("/:id/password", async (req, res) => {
	const userId = Number.parseInt(req.params.id, 10);
	const { password } = req.body;
	if (Number.isNaN(userId) || !password) {
		res.status(400).json({ error: "Datos inválidos" });
		return;
	}
	try {
		const hashed = await bcrypt.hash(password, 10);
		const result = await pool.query(
			"UPDATE users SET password = $1 WHERE id = $2 RETURNING id",
			[hashed, userId],
		);
		if (result.rowCount === 0) {
			res.status(404).json({ error: "Usuario no encontrado" });
			return;
		}
		res.json({ message: "Contraseña actualizada" });
	} catch {
		res.status(500).json({ error: "Error" });
	}
});

// Delete user (and their files)
router.delete("/:id", async (req, res) => {
	const userId = Number.parseInt(req.params.id, 10);
	if (Number.isNaN(userId)) {
		res.status(400).json({ error: "ID inválido" });
		return;
	}
	try {
		await pool.query(
			"DELETE FROM document_management_file WHERE user_id = $1",
			[userId],
		);
		const result = await pool.query(
			"DELETE FROM users WHERE id = $1 RETURNING id",
			[userId],
		);
		if (result.rowCount === 0) {
			res.status(404).json({ error: "Usuario no encontrado" });
			return;
		}
		res.json({ message: "Usuario y documentos eliminados" });
	} catch {
		res.status(500).json({ error: "Error al eliminar" });
	}
});

export default router;
