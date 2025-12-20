import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth-jwt';
import { GitHubController } from '../controllers/github.controller';

const router = Router();

// Validar acceso a repositorio
router.post('/validate', isAuthenticated, GitHubController.validateRepository);

// Obtener información del repositorio
router.post('/repository', isAuthenticated, GitHubController.getRepositoryInfo);

// Obtener Pull Requests con paginación
router.post('/pull-requests', isAuthenticated, GitHubController.getPullRequests);

// Obtener métricas del repositorio
router.post('/metrics', isAuthenticated, GitHubController.getRepositoryMetrics);

export default router;
