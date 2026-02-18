// src/routes/tokens.ts
import { Router } from 'express';
import { TokenController } from '../controllers/token.controller';
import { isAuthenticated } from '../middlewares/auth-jwt';

const router = Router();

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// Obtener todos los tokens del usuario
router.get('/', TokenController.getTokens);

// Guardar o actualizar un token
router.post('/', TokenController.saveToken);

// Eliminar un token
router.delete('/:id', TokenController.deleteToken);

export default router;