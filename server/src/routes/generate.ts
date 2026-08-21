import express from "express";
import { geminiAgent, analyzeRequest } from "../geminiAgent";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { checkAICredits, consumeAICredits } from "../middlewares/usageLimits.middleware";

const router = express.Router();

/**
 * Endpoint principal del agente Gemini
 * 1. Verifica autenticación
 * 2. Verifica créditos o token custom
 * 3. Procesa la petición
 * 4. Consume créditos si fue exitosa y no usó token custom
 */
router.post("/", isAuthenticated, checkAICredits, async (req, res) => {
  console.log("🔄 Nueva petición a Gemini Agent:", req.body);

  const { prompt, image, audio, video, file, model } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Falta el prompt" });
    return;
  }

  try {
    // Obtener el token custom si está usando token custom
    const useCustomToken = (req as any).useCustomToken;
    const customToken = (req as any).customToken;

    // Usar el nuevo agente inteligente
    const result = await geminiAgent({
      prompt,
      image: image || undefined,
      audio: audio || undefined,
      video: video || undefined,
      file: file || undefined,
      model: model || "gemini-2.5-flash",
      customToken: useCustomToken ? customToken : undefined
    });

    console.log("✅ Respuesta generada exitosamente");
    
    // Si la operación fue exitosa, consumir créditos
    if (!useCustomToken) {
      await consumeAICredits(req, res, () => {
        res.json({
          ...result,
          billing: {
            used_custom_token: false,
            credits_consumed: 1
          }
        });
      });
    } else {
      res.json({
        ...result,
        billing: {
          used_custom_token: true,
          credits_consumed: 0
        }
      });
    }
  } catch (err) {
    console.error("❌ Error en Gemini Agent:", err);
    res.status(500).json({
      error: "Error interno del agente",
      details: err instanceof Error ? err.message : "Error desconocido",
    });
  }
});


router.post("/text", isAuthenticated, checkAICredits, async (req, res) => {

  // TODO: Aquí se debe de intentar obtener un id para evitar repetir una misma peticion a la IA, investigar si ya existe una tabla creada en la base de datos para guardado temporal de mensagen, ver en supabase.
  const { prompt, model } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Falta el prompt" });
    return;
  }

  // TODO: Consultar la base de datos para investigar si ya existe una peticion similar guardada, en cuyo caso retirnamos esa rspuesta, comparar los valores para prompt e id para asegurarse de que coincida

  try {
    const useCustomToken = (req as any).useCustomToken;
    const customToken = (req as any).customToken;

    const result = await geminiAgent({
      prompt,
      forse_text_response: true,
      // TODO: El modelo gemini-2.5-flash podria estar a punto de desaparecer, investigar cual es sus sustituto en google.
      model: model || "gemini-2.5-flash",
      customToken: useCustomToken ? customToken : undefined
    });

    // TODO: Si la respuesta es positiva aqui se podria guardar de form temporal asociado al id enviado por el cliente, no es obligatorio enviar el id, si no se envia no se guardara.

    if (!useCustomToken) {
      await consumeAICredits(req, res, () => {
        res.json({
          ...result,
          billing: {
            used_custom_token: false,
            credits_consumed: 1
          }
        });
      });
    } else {
      res.json({
        ...result,
        billing: {
          used_custom_token: true,
          credits_consumed: 0
        }
      });
    }
  } catch (err) {
    console.error("❌ Error en Gemini Agent:", err);
    res.status(500).json({
      error: "Error interno del agente",
      // TODO: Es posible que aqui se pierda eml mensaje de error si no es del tipo Error, entonces no se podria saber por que fallo una peticion determinada
      details: err instanceof Error ? err.message : "Error desconocido",
    });
  }
});


/**
 * Endpoint de análisis para debugging
 * Permite analizar un prompt sin consumir créditos
 */
router.post("/analyze", isAuthenticated, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Falta el prompt" });
    return;
  }

  try {
    const analysis = await analyzeRequest(prompt);

    res.json({
      analysis,
      prompt,
    });
  } catch (err) {
    console.error("Error analizando:", err);
    res.status(500).json({ error: "Error en análisis" });
  }
});

export default router;
// TODO: Esta fue la tabla creada en el servidor de bases de datos de supabase
/**
 -- 1. Crear la tabla de idempotencia/caché
CREATE TABLE public.ai_request_cache (
    request_id TEXT PRIMARY KEY,
    response_body JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar acceso de lectura/escritura (Si no usas RLS estricto para consumo interno)
ALTER TABLE public.ai_request_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a la clave de servicio" ON public.ai_request_cache 
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Crear una función que elimina registros con más de 24 horas
CREATE OR REPLACE FUNCTION public.clean_old_ai_requests()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.ai_request_cache 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear un disparador que ejecute la limpieza ANTES de insertar cualquier fila nueva
CREATE OR REPLACE TRIGGER trigger_clean_ai_requests
BEFORE INSERT ON public.ai_request_cache
FOR EACH STATEMENT
EXECUTE FUNCTION public.clean_old_ai_requests();
 */