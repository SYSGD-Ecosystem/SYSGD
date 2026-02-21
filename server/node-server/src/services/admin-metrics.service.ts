import { pool } from "../db";
import { normalizeBillingState, type BillingState } from "./billing-credits.service";

export interface GeneralMetrics {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  totalRegistrosContables: number;
}

export interface UsuarioContabilidad {
  userId: string;
  nombre: string;
  email: string;
  tieneRegistro: boolean;
  creditos: number;
  ultimoUpdate: string | null;
}

export interface ContabilidadMetrics {
  usuariosActivos: number;
  totalRegistros: number;
  usuarios: UsuarioContabilidad[];
}

export interface UsuarioProyectos {
  userId: string;
  nombre: string;
  email: string;
  proyectosCount: number;
  tareasCount: number;
  creditos: number;
}

export interface ProyectosMetrics {
  usuarios: UsuarioProyectos[];
}

export interface AdminMetrics {
  general: GeneralMetrics;
  contabilidad: ContabilidadMetrics;
  proyectos: ProyectosMetrics;
}

async function getUserCredits(userId: string): Promise<number> {
  try {
    const { rows } = await pool.query(
      "SELECT user_data->'billing'->>'ai_task_credits' as creditos FROM users WHERE id = $1",
      [userId]
    );
    if (rows.length === 0 || !rows[0].creditos) return 0;
    return parseInt(rows[0].creditos, 10) || 0;
  } catch {
    return 0;
  }
}

export async function getGeneralMetrics(): Promise<GeneralMetrics> {
  const result = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE privileges != 'admin') as total_users,
      (SELECT COUNT(*) FROM projects) as total_projects,
      (SELECT COUNT(*) FROM tasks) as total_tasks,
      (SELECT COUNT(*) FROM cont_ledger_records) as total_registros
  `);

  const row = result.rows[0];
  return {
    totalUsers: parseInt(row.total_users, 10) || 0,
    totalProjects: parseInt(row.total_projects, 10) || 0,
    totalTasks: parseInt(row.total_tasks, 10) || 0,
    totalRegistrosContables: parseInt(row.total_registros, 10) || 0,
  };
}

export async function getContabilidadMetrics(): Promise<ContabilidadMetrics> {
  const { rows } = await pool.query(`
    SELECT 
      u.id as user_id,
      u.name,
      u.email,
      clr.updated_at as ultimo_update,
      CASE WHEN clr.user_id IS NOT NULL THEN true ELSE false END as tiene_registro
    FROM users u
    LEFT JOIN cont_ledger_records clr ON u.id = clr.user_id
    WHERE u.privileges != 'admin'
    ORDER BY clr.updated_at DESC NULLS LAST
  `);

  const usuariosActivos = rows.filter((r: any) => r.tiene_registro).length;

  const usuarios: UsuarioContabilidad[] = await Promise.all(
    rows.map(async (row: any) => {
      const creditos = await getUserCredits(row.user_id);
      return {
        userId: row.user_id,
        nombre: row.name || "Sin nombre",
        email: row.email,
        tieneRegistro: row.tiene_registro,
        creditos,
        ultimoUpdate: row.ultimo_update || null,
      };
    })
  );

  return {
    usuariosActivos,
    totalRegistros: usuariosActivos,
    usuarios,
  };
}

export async function getProyectosMetrics(): Promise<ProyectosMetrics> {
  const { rows } = await pool.query(`
    SELECT 
      u.id as user_id,
      u.name,
      u.email,
      COUNT(DISTINCT p.id) as proyectos_count,
      COUNT(DISTINCT t.id) as tareas_count
    FROM users u
    LEFT JOIN projects p ON u.id = p.created_by
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE u.privileges != 'admin'
    GROUP BY u.id, u.name, u.email
    ORDER BY proyectos_count DESC, tareas_count DESC
  `);

  const usuarios: UsuarioProyectos[] = await Promise.all(
    rows.map(async (row: any) => {
      const creditos = await getUserCredits(row.user_id);
      return {
        userId: row.user_id,
        nombre: row.name || "Sin nombre",
        email: row.email,
        proyectosCount: parseInt(row.proyectos_count, 10) || 0,
        tareasCount: parseInt(row.tareas_count, 10) || 0,
        creditos,
      };
    })
  );

  return {
    usuarios,
  };
}

export async function getAllMetrics(): Promise<AdminMetrics> {
  const [general, contabilidad, proyectos] = await Promise.all([
    getGeneralMetrics(),
    getContabilidadMetrics(),
    getProyectosMetrics(),
  ]);

  return {
    general,
    contabilidad,
    proyectos,
  };
}
