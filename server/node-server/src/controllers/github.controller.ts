import { Request, Response } from 'express';
import { GitHubService } from '../services/github.service';
import { z } from 'zod';
import { pool } from '../db';

const githubConfigSchema = z.object({
  owner: z.string().min(1, 'Owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  token: z.string().min(1, 'GitHub token is required'),
});

const githubConfigByProjectSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  owner: z.string().min(1, 'Owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
});

const githubConfigLookupSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

const githubTokenByProjectSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  token: z.string().min(1, 'GitHub token is required'),
});

const pullRequestFiltersSchema = z.object({
  state: z.enum(['open', 'closed', 'all']).optional(),
  sort: z.enum(['created', 'updated', 'popularity']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export class GitHubController {
  private static getEncryptionKey() {
    const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Missing GITHUB_TOKEN_ENCRYPTION_KEY env var');
    }
    return key;
  }

  private static async getUserIdFromRequest(req: Request): Promise<number | null> {
    const user = req.user as any;
    const userId = user?.id;
    return typeof userId === 'number' ? userId : null;
  }

  private static async assertProjectAccess(projectId: string, userId: number) {
    // Admin puede todo, pero si no tenemos privileges en el token, seguimos el patrón existente.
    const result = await pool.query(
      `
      SELECT 1
      FROM projects p
      LEFT JOIN resource_access ra
        ON ra.resource_type = 'project'
        AND ra.resource_id = p.id
        AND ra.user_id = $2
      WHERE p.id = $1 AND (p.created_by = $2 OR ra.user_id = $2)
      LIMIT 1
      `,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      const err: any = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }
  }

  private static async getSavedConfig(projectId: string) {
    const result = await pool.query(
      `
      SELECT owner,
             repo
      FROM github_project_config
      WHERE project_id = $1
      LIMIT 1
      `,
      [projectId]
    );
    return result.rows[0] || null;
  }

  static async saveUserToken(req: Request, res: Response) {
    try {
      const userId = await GitHubController.getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { projectId, token } = githubTokenByProjectSchema.parse(req.body);
      await GitHubController.assertProjectAccess(projectId, userId);
      const key = GitHubController.getEncryptionKey();

      await pool.query(
        `
        INSERT INTO github_project_user_token (project_id, user_id, token_encrypted, created_at, updated_at)
        VALUES ($1, $2, pgp_sym_encrypt($3, $4), NOW(), NOW())
        ON CONFLICT (project_id, user_id)
        DO UPDATE SET
          token_encrypted = EXCLUDED.token_encrypted,
          updated_at = NOW()
        `,
        [projectId, userId, token, key]
      );

      return res.json({ saved: true });
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error saving GitHub user token:', error);
      return res.status(status).json({
        message: 'Failed to save GitHub token',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error'),
      });
    }
  }

  static async getUserTokenStatus(req: Request, res: Response) {
    try {
      const userId = await GitHubController.getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { projectId } = githubConfigLookupSchema.parse(req.params);
      await GitHubController.assertProjectAccess(projectId, userId);

      const token = await GitHubController.getUserToken(projectId, userId);
      return res.json({ configured: Boolean(token) });
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error fetching GitHub user token status:', error);
      return res.status(status).json({
        message: 'Failed to get GitHub token status',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error'),
      });
    }
  }

  static async deleteUserToken(req: Request, res: Response) {
    try {
      const userId = await GitHubController.getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { projectId } = githubConfigLookupSchema.parse(req.params);
      await GitHubController.assertProjectAccess(projectId, userId);

      await pool.query(
        'DELETE FROM github_project_user_token WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );

      return res.json({ deleted: true });
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error deleting GitHub user token:', error);
      return res.status(status).json({
        message: 'Failed to delete GitHub token',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error'),
      });
    }
  }

  private static async getUserToken(projectId: string, userId: number) {
    const key = GitHubController.getEncryptionKey();
    const result = await pool.query(
      `
      SELECT pgp_sym_decrypt(token_encrypted, $3)::text AS token
      FROM github_project_user_token
      WHERE project_id = $1 AND user_id = $2
      LIMIT 1
      `,
      [projectId, userId, key]
    );
    return result.rows[0]?.token || null;
  }

  private static async resolveConfig(req: Request) {
    const body: any = req.body || {};

    // Si viene token directo, se usa igual que antes.
    if (body.owner && body.repo && body.token) {
      return githubConfigSchema.parse(body);
    }

    // Si viene projectId, usamos configuración guardada.
    if (body.projectId) {
      const { projectId } = githubConfigLookupSchema.parse({ projectId: body.projectId });
      const userId = await GitHubController.getUserIdFromRequest(req);
      if (!userId) {
        const err: any = new Error('Usuario no autenticado');
        err.statusCode = 401;
        throw err;
      }

      await GitHubController.assertProjectAccess(projectId, userId);

      const saved = await GitHubController.getSavedConfig(projectId);
      if (!saved) {
        const err: any = new Error('GitHub configuration not found for this project');
        err.statusCode = 404;
        throw err;
      }

      const token = await GitHubController.getUserToken(projectId, userId);
      if (!token) {
        const err: any = new Error('GitHub token not configured for this user');
        err.statusCode = 412;
        throw err;
      }

      return githubConfigSchema.parse({ owner: saved.owner, repo: saved.repo, token });
    }

    // Si no hay nada, fallamos explícitamente.
    throw new Error('Missing GitHub configuration. Provide {owner, repo, token} or {projectId}.');
  }

  static async validateRepository(req: Request, res: Response) {
    try {
      const { owner, repo, token } = await GitHubController.resolveConfig(req);
      
      const githubService = new GitHubService(token);
      const isValid = await githubService.validateRepository(owner, repo);

      if (isValid) {
        res.json({ 
          valid: true, 
          message: 'Repository is accessible' 
        });
      } else {
        res.status(400).json({ 
          valid: false, 
          message: 'Repository not found or no access' 
        });
      }
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error validating repository:', error);
      res.status(status).json({
        message: error?.message || 'Invalid request parameters',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error')
      });
    }
  }

  static async getRepositoryInfo(req: Request, res: Response) {
    try {
      const { owner, repo, token } = await GitHubController.resolveConfig(req);
      
      const githubService = new GitHubService(token);
      const repoInfo = await githubService.getRepositoryInfo(owner, repo);

      res.json(repoInfo);
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error fetching repository info:', error);
      res.status(status).json({
        message: error?.message || 'Failed to fetch repository information',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error')
      });
    }
  }

  static async getPullRequests(req: Request, res: Response) {
    try {
      const { owner, repo, token } = await GitHubController.resolveConfig(req);
      const filters = pullRequestFiltersSchema.parse(req.query);
      
      const githubService = new GitHubService(token);
      const result = await githubService.getPullRequests(
        owner, 
        repo, 
        filters.page, 
        filters.perPage, 
        {
          state: filters.state,
          sort: filters.sort,
          direction: filters.direction,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }
      );

      res.json(result);
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error fetching pull requests:', error);
      res.status(status).json({
        message: error?.message || 'Failed to fetch pull requests',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error')
      });
    }
  }

  static async getRepositoryMetrics(req: Request, res: Response) {
    try {
      const { owner, repo, token } = await GitHubController.resolveConfig(req);
      
      const githubService = new GitHubService(token);
      const metrics = await githubService.getRepositoryMetrics(owner, repo);

      res.json(metrics);
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error fetching repository metrics:', error);
      res.status(status).json({
        message: error?.message || 'Failed to fetch repository metrics',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error')
      });
    }
  }

  static async saveProjectConfig(req: Request, res: Response) {
    try {
      const userId = await GitHubController.getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { projectId, owner, repo } = githubConfigByProjectSchema.parse(req.body);
      await GitHubController.assertProjectAccess(projectId, userId);

      // Guardamos SOLO owner/repo aquí. El token es por usuario y se guarda en otro endpoint.
      const result = await pool.query(
        `
        INSERT INTO github_project_config (project_id, owner, repo, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (project_id)
        DO UPDATE SET
          owner = EXCLUDED.owner,
          repo = EXCLUDED.repo,
          updated_at = NOW()
        RETURNING id, project_id, owner, repo, created_by, created_at, updated_at
        `,
        [projectId, owner, repo, userId]
      );

      return res.json({ saved: true, configuration: result.rows[0] });
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error saving GitHub project config:', error);
      return res.status(status).json({
        message: 'Failed to save GitHub configuration',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error'),
      });
    }
  }

  static async getProjectConfig(req: Request, res: Response) {
    try {
      const userId = await GitHubController.getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { projectId } = githubConfigLookupSchema.parse(req.params);
      await GitHubController.assertProjectAccess(projectId, userId);

      const result = await pool.query(
        `
        SELECT id, project_id, owner, repo, created_by, created_at, updated_at
        FROM github_project_config
        WHERE project_id = $1
        LIMIT 1
        `,
        [projectId]
      );

      if (result.rows.length === 0) {
        return res.json({ configured: false });
      }

      return res.json({ configured: true, configuration: result.rows[0] });
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error fetching GitHub project config:', error);
      return res.status(status).json({
        message: 'Failed to get GitHub configuration',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error'),
      });
    }
  }

  static async deleteProjectConfig(req: Request, res: Response) {
    try {
      const userId = await GitHubController.getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { projectId } = githubConfigLookupSchema.parse(req.params);
      await GitHubController.assertProjectAccess(projectId, userId);

      await pool.query('DELETE FROM github_project_config WHERE project_id = $1', [projectId]);
      return res.json({ deleted: true });
    } catch (error: any) {
      const status = error?.statusCode || 400;
      console.error('Error deleting GitHub project config:', error);
      return res.status(status).json({
        message: 'Failed to delete GitHub configuration',
        error: error instanceof z.ZodError ? error.errors : (error?.message || 'Unknown error'),
      });
    }
  }
}
