// controllers/openrouter.controller.ts
import { Request, Response } from 'express';
import { openRouterService } from '../services/openrouter.service';

/**
 * CONTROLADOR DE OPENROUTER
 * Maneja la lógica de HTTP: validaciones, responses, errores
 */
class OpenRouterController {

  /**
   * Procesa una petición del agente OpenRouter
   */
  async processAgent(req: Request, res: Response): Promise<void> {
    console.log('🤖 OpenRouter Agent - Nueva petición');

    try {
      // 1. Validar datos de entrada
      const { prompt, image, audio, video, file, model } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        res.status(400).json({
          error: 'Prompt requerido',
          details: 'El campo "prompt" debe ser un string no vacío'
        });
        return;
      }

      // 2. Obtener información de autenticación y tokens
      const useCustomToken = (req as any).useCustomToken || false;
      const customToken = (req as any).customToken;

      // 3. Llamar al servicio
      const result = await openRouterService.processRequest({
        prompt,
        image: image || undefined,
        audio: audio || undefined,
        video: video || undefined,
        file: file || undefined,
        model: model || undefined,
        customToken: useCustomToken ? customToken : undefined
      });

      console.log('✅ Respuesta generada exitosamente');

      // 4. Construir respuesta
      const response = {
        ...result,
        billing: {
          used_custom_token: useCustomToken,
          credits_consumed: useCustomToken ? 0 : 1
        }
      };

      // 5. Si usó el sistema de créditos, consumir (middleware ya lo maneja)
      if (!useCustomToken) {
        // El middleware consumeAICredits se encargará
        (req as any).aiResponse = response;
      }

      res.status(200).json(response);

    } catch (error) {
      console.error('❌ Error en OpenRouter Controller:', error);
      
      // Manejo de errores específicos
      if (error instanceof Error) {
        if (error.message.includes('API Key')) {
          res.status(401).json({
            error: 'Error de autenticación',
            details: 'API Key de OpenRouter inválida o no configurada'
          });
          return;
        }

        if (error.message.includes('OpenRouter error')) {
          res.status(502).json({
            error: 'Error del servicio externo',
            details: error.message
          });
          return;
        }
      }

      // Error genérico
      res.status(500).json({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Analiza un prompt sin procesarlo (para debugging)
   */
  async analyzePrompt(req: Request, res: Response): Promise<void> {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        res.status(400).json({
          error: 'Prompt requerido'
        });
        return;
      }

      const analysis = await openRouterService.analyzeRequest(prompt);

      res.status(200).json({
        prompt,
        analysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error analizando prompt:', error);
      res.status(500).json({
        error: 'Error en análisis',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Health check del servicio
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    const hasApiKey = !!process.env.OPENROUTER_API_KEY;
    
    res.status(200).json({
      service: 'OpenRouter Agent',
      status: 'operational',
      configured: hasApiKey,
      timestamp: new Date().toISOString()
    });
  }
}

// Exportar instancia única
export const openRouterController = new OpenRouterController();

// Exportar también la clase
export default OpenRouterController;