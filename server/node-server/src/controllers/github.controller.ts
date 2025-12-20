import { Request, Response } from 'express';
import { GitHubService } from '../services/github.service';
import { z } from 'zod';

const githubConfigSchema = z.object({
  owner: z.string().min(1, 'Owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  token: z.string().min(1, 'GitHub token is required'),
});

const pullRequestFiltersSchema = z.object({
  state: z.enum(['open', 'closed', 'all']).optional(),
  sort: z.enum(['created', 'updated', 'popularity']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export class GitHubController {
  static async validateRepository(req: Request, res: Response) {
    try {
      const { owner, repo, token } = githubConfigSchema.parse(req.body);
      
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
    } catch (error) {
      console.error('Error validating repository:', error);
      res.status(400).json({ 
        message: 'Invalid request parameters',
        error: error instanceof z.ZodError ? error.errors : 'Unknown error'
      });
    }
  }

  static async getRepositoryInfo(req: Request, res: Response) {
    try {
      const { owner, repo, token } = githubConfigSchema.parse(req.body);
      
      const githubService = new GitHubService(token);
      const repoInfo = await githubService.getRepositoryInfo(owner, repo);

      res.json(repoInfo);
    } catch (error) {
      console.error('Error fetching repository info:', error);
      res.status(400).json({ 
        message: 'Failed to fetch repository information',
        error: error instanceof z.ZodError ? error.errors : 'Unknown error'
      });
    }
  }

  static async getPullRequests(req: Request, res: Response) {
    try {
      const { owner, repo, token } = githubConfigSchema.parse(req.body);
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
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      res.status(400).json({ 
        message: 'Failed to fetch pull requests',
        error: error instanceof z.ZodError ? error.errors : 'Unknown error'
      });
    }
  }

  static async getRepositoryMetrics(req: Request, res: Response) {
    try {
      const { owner, repo, token } = githubConfigSchema.parse(req.body);
      
      const githubService = new GitHubService(token);
      const metrics = await githubService.getRepositoryMetrics(owner, repo);

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching repository metrics:', error);
      res.status(400).json({ 
        message: 'Failed to fetch repository metrics',
        error: error instanceof z.ZodError ? error.errors : 'Unknown error'
      });
    }
  }
}
