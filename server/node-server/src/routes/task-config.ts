import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth-jwt';
import {
  getTaskConfig,
  updateTaskConfig,
  addTaskType,
  removeTaskType,
  addTaskState,
  removeTaskState,
  addTaskPriority,
  removeTaskPriority
} from '../controllers/task-config.controller';

const router = Router();

// Obtener configuración de tareas de un proyecto
router.get('/projects/:projectId/task-config', isAuthenticated, getTaskConfig);

// Actualizar configuración completa
router.put('/projects/:projectId/task-config', isAuthenticated, updateTaskConfig);

// Gestión de tipos
router.post('/projects/:projectId/task-config/types', isAuthenticated, addTaskType);
router.delete('/projects/:projectId/task-config/types/:typeName', isAuthenticated, removeTaskType);

// Gestión de estados
router.post('/projects/:projectId/task-config/states', isAuthenticated, addTaskState);
router.delete('/projects/:projectId/task-config/states/:stateName', isAuthenticated, removeTaskState);

// Gestión de prioridades
router.post('/projects/:projectId/task-config/priorities', isAuthenticated, addTaskPriority);
router.delete('/projects/:projectId/task-config/priorities/:priorityName', isAuthenticated, removeTaskPriority);

export default router;
