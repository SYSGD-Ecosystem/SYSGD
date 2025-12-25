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

// Guardar configuración GitHub por proyecto
router.post('/project-config', isAuthenticated, GitHubController.saveProjectConfig);

// Obtener configuración GitHub de un proyecto
router.get('/project-config/:projectId', isAuthenticated, GitHubController.getProjectConfig);

// Eliminar configuración GitHub de un proyecto
router.delete('/project-config/:projectId', isAuthenticated, GitHubController.deleteProjectConfig);

// Guardar token GitHub del usuario (por proyecto)
router.post('/user-token', isAuthenticated, GitHubController.saveUserToken);

// Saber si el usuario actual ya configuró su token
router.get('/user-token/:projectId/status', isAuthenticated, GitHubController.getUserTokenStatus);

// Eliminar token del usuario actual
router.delete('/user-token/:projectId', isAuthenticated, GitHubController.deleteUserToken);

export default router;
