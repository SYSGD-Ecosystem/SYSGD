// routes/openrouter.routes.ts
import express from 'express';
import { openRouterController } from '../controllers/openrouter.controller';
import { isAuthenticated } from '../middlewares/auth-jwt';
import { checkAICredits, consumeAICredits } from '../middlewares/usageLimits.middleware';

const router = express.Router();

/**
 * RUTAS DE OPENROUTER
 * Define los endpoints y aplica middlewares
 */

/**
 * POST /api/openrouter
 * Endpoint principal del agente OpenRouter
 * 
 * Middlewares aplicados:
 * 1. isAuthenticated - Verifica que el usuario esté autenticado
 * 2. checkAICredits - Verifica que tenga créditos disponibles
 * 3. consumeAICredits - Consume créditos después de la operación exitosa
 */
router.post(
  '/',
  isAuthenticated,
  checkAICredits,
  async (req, res, next) => {
    await openRouterController.processAgent(req, res);
    
    // Si la operación fue exitosa y no usó token custom, consumir créditos
    const useCustomToken = (req as any).useCustomToken;
    if (!useCustomToken && (req as any).aiResponse) {
      await consumeAICredits(req, res, () => {
        // Los créditos ya fueron consumidos, continuar
      });
    }
  }
);

/**
 * POST /api/openrouter/analyze
 * Analiza un prompt sin procesarlo ni consumir créditos
 * Útil para debugging y testing
 */
router.post(
  '/analyze',
  isAuthenticated,
  (req, res) => openRouterController.analyzePrompt(req, res)
);

/**
 * GET /api/openrouter/health
 * Health check del servicio
 * No requiere autenticación
 */
router.get(
  '/health',
  (req, res) => openRouterController.healthCheck(req, res)
);

/**
 * GET /api/openrouter/models
 * Lista los modelos disponibles en OpenRouter
 * Requiere autenticación
 */
router.get(
  '/models',
  isAuthenticated,
  async (req, res) => {
    res.json({
      text_models: [
        'openai/gpt-oss-120b:free',
        'openai/gpt-4-turbo',
        'anthropic/claude-3-opus',
        'google/gemini-pro'
      ],
      image_models: [
        'google/gemini-2.5-flash-image-preview',
        'openai/dall-e-3'
      ]
    });
  }
);

export default router;