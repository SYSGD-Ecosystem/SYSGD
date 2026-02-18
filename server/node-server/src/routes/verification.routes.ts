// src/routes/verification.routes.ts
import { Router } from 'express';
import { VerificationController } from '../controllers/verificationController';
import { isAuthenticated } from '../middlewares/auth-jwt';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

/**
 * Verifica el email usando el token
 */
router.post('/verify-email', VerificationController.verifyEmail);

/**
 * Solicita un email de recuperación de contraseña
 */
router.post('/request-password-reset', VerificationController.requestPasswordReset);

/**
 * Restablece la contraseña usando el token
 */
router.post('/reset-password', VerificationController.resetPassword);

// ============================================
// RUTAS AUTENTICADAS
// ============================================

router.use(isAuthenticated);

/**
 * Reenvía el email de verificación
 */
router.post('/resend-verification', VerificationController.sendVerificationEmail);

/**
 * Obtiene el estado de verificación del usuario actual
 */
router.get('/status', VerificationController.getVerificationStatus);

export default router;