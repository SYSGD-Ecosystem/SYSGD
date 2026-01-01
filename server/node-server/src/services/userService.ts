// services/userService.ts
import bcrypt from "bcrypt";
import { pool } from "../db";
import type { 
  User, 
  CreateUserData, 
  UpdateUserData, 
  BillingData,
  UserData 
} from "../types/user";
import { DEFAULT_USER_DATA, DEFAULT_BILLING_LIMITS } from "../types/user";

export class UserService {
  
  // Obtener todos los usuarios
  async getAllUsers(): Promise<User[]> {
    const { rows } = await pool.query<User>(
      "SELECT id, name, email, privileges, status, is_public, user_data, created_at FROM users ORDER BY created_at DESC"
    );
    return rows;
  }

  // Obtener usuario por ID
  async getUserById(id: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      "SELECT id, name, email, privileges, status, is_public, user_data, created_at FROM users WHERE id = $1",
      [id]
    );
    return rows[0] || null;
  }

  // Crear usuario
  async createUser(data: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Verificar si es el primer usuario (será admin)
    const { rows: countRows } = await pool.query("SELECT COUNT(*) as count FROM users");
    const isFirstUser = parseInt(countRows[0].count) === 0;
    
    const privileges = isFirstUser ? "admin" : (data.privileges || "user");
    const status = data.status || "active";
    
    const { rows } = await pool.query<User>(
      `INSERT INTO users (name, email, password, privileges, status, user_data) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, privileges, status, is_public, user_data, created_at`,
      [data.name, data.email, hashedPassword, privileges, status, DEFAULT_USER_DATA]
    );
    
    return rows[0];
  }

  // Actualizar usuario
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }

    if (data.email) {
      fields.push(`email = $${idx++}`);
      values.push(data.email);
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      fields.push(`password = $${idx++}`);
      values.push(hashedPassword);
    }

    if (data.privileges) {
      fields.push(`privileges = $${idx++}`);
      values.push(data.privileges);
    }

    if (data.status) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (data.user_data) {
      // Merge con datos existentes
      fields.push(`user_data = user_data || $${idx++}::jsonb`);
      values.push(data.user_data);
    }

    values.push(id);

    if (fields.length === 0) {
      throw new Error("No hay datos para actualizar");
    }

    const { rows } = await pool.query<User>(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} 
       RETURNING id, name, email, privileges, status, is_public, user_data, created_at`,
      values
    );

    if (rows.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    return rows[0];
  }

  // Eliminar usuario
  async deleteUser(id: string): Promise<void> {
    await pool.query("BEGIN");
    
    try {
      // Eliminar documentos relacionados
      await pool.query("DELETE FROM document_management_file WHERE user_id = $1", [id]);
      
      // Eliminar usuario
      const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
      
      if (rowCount === 0) {
        throw new Error("Usuario no encontrado");
      }
      
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  // Actualizar tier y créditos
  async updatePlan(
    userId: string, 
    tier: BillingData["tier"], 
    credits?: number
  ): Promise<BillingData> {
    const limits = DEFAULT_BILLING_LIMITS[tier];
    
    const { rows } = await pool.query<{ billing: BillingData }>(
      `UPDATE users 
       SET user_data = jsonb_set(
         jsonb_set(
           COALESCE(user_data, '{}'::jsonb),
           '{billing,tier}',
           $1::jsonb
         ),
         '{billing,limits}',
         $2::jsonb
       ) || 
       CASE 
         WHEN $3::int IS NOT NULL THEN 
           jsonb_build_object('billing', jsonb_build_object('ai_task_credits', $3))
         ELSE '{}'::jsonb
       END
       WHERE id = $4
       RETURNING user_data->'billing' as billing`,
      [JSON.stringify(tier), JSON.stringify(limits), credits, userId]
    );

    if (rows.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    return rows[0].billing;
  }

  // Agregar créditos
  async addCredits(
    userId: string, 
    amount: number, 
    isPurchase: boolean = false
  ): Promise<{ total: number; purchased: number }> {
    await pool.query("BEGIN");
    
    try {
      const { rows: lockRows } = await pool.query<{ billing: BillingData }>(
        "SELECT user_data->'billing' as billing FROM users WHERE id = $1 FOR UPDATE",
        [userId]
      );

      if (lockRows.length === 0) {
        throw new Error("Usuario no encontrado");
      }

      const billing = lockRows[0].billing || { ai_task_credits: 0, purchased_credits: 0 };
      
      let query: string;
      if (isPurchase) {
        query = `UPDATE users 
                 SET user_data = jsonb_set(
                   jsonb_set(
                     user_data,
                     '{billing,ai_task_credits}',
                     to_jsonb((user_data->'billing'->>'ai_task_credits')::int + $1)
                   ),
                   '{billing,purchased_credits}',
                   to_jsonb((user_data->'billing'->>'purchased_credits')::int + $1)
                 )
                 WHERE id = $2
                 RETURNING user_data->'billing' as billing`;
      } else {
        query = `UPDATE users 
                 SET user_data = jsonb_set(
                   user_data,
                   '{billing,ai_task_credits}',
                   to_jsonb((user_data->'billing'->>'ai_task_credits')::int + $1)
                 )
                 WHERE id = $2
                 RETURNING user_data->'billing' as billing`;
      }

      const { rows } = await pool.query<{ billing: BillingData }>(query, [amount, userId]);
      
      await pool.query("COMMIT");
      
      return {
        total: rows[0].billing.ai_task_credits,
        purchased: rows[0].billing.purchased_credits,
      };
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  // Actualizar token personalizado
  async updateCustomToken(userId: string, token: string): Promise<void> {
    const { rowCount } = await pool.query(
      `UPDATE users 
       SET user_data = jsonb_set(
         COALESCE(user_data, '{}'::jsonb),
         '{custom_tokens,gemini}',
         $1::jsonb
       )
       WHERE id = $2`,
      [JSON.stringify(token), userId]
    );

    if (rowCount === 0) {
      throw new Error("Usuario no encontrado");
    }
  }

  // Consumir créditos (para uso en middlewares)
  async consumeCredits(userId: string, amount: number): Promise<boolean> {
    const { rows } = await pool.query<{ billing: BillingData }>(
      `UPDATE users 
       SET user_data = jsonb_set(
         user_data,
         '{billing,ai_task_credits}',
         to_jsonb(GREATEST(0, (user_data->'billing'->>'ai_task_credits')::int - $1))
       )
       WHERE id = $2 
         AND (user_data->'billing'->>'ai_task_credits')::int >= $1
       RETURNING user_data->'billing' as billing`,
      [amount, userId]
    );

    return rows.length > 0;
  }
}