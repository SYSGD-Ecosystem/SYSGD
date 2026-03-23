import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Tipos de error específicos
export type GeminiErrorType = 
  | 'no_credits'           // 402: Sin créditos
  | 'unauthorized'         // 401: No autenticado
  | 'network'              // Error de red
  | 'server'               // 500: Error del servidor
  | 'rate_limit'           // 429: Demasiadas peticiones
  | 'unknown';             // Error desconocido

export interface GeminiError {
  type: GeminiErrorType;
  message: string;
  statusCode?: number;
  details?: any;
  canRetry: boolean;
  actionRequired?: 'purchase' | 'login' | 'configure_token' | 'wait';
}

export interface UseGeminiReturn {
  improvedText: string;
  loading: boolean;
  error: GeminiError | null;
  handleImprove: (
    title: string,
    description: string,
    projectContext?: { name: string; description: string },
    model?: string,
    provider?: string,
  ) => Promise<boolean>;
  clearError: () => void;
  retry: () => Promise<boolean>;
}

export const useGemini = (): UseGeminiReturn => {
  const [improvedText, setImprovedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeminiError | null>(null);
  const [lastRequest, setLastRequest] = useState<{
    title: string;
    description: string;
    projectContext?: { name: string; description: string };
    model?: string;
    provider?: string;
  } | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const parseError = (err: any): GeminiError => {
    const statusCode = err.response?.status;
    const errorData = err.response?.data;

    // Error 402: Sin créditos
    if (statusCode === 402) {
      const hasCustomToken = errorData?.hasCustomToken || false;
      
      return {
        type: 'no_credits',
        message: hasCustomToken 
          ? 'No tienes créditos disponibles. Aunque tienes un token configurado, ha alcanzado su límite.'
          : 'Te has quedado sin créditos. Compra más créditos o configura tu propio token de Gemini.',
        statusCode,
        details: errorData,
        canRetry: false,
        actionRequired: hasCustomToken ? 'purchase' : 'configure_token',
      };
    }

    // Error 401: No autenticado
    if (statusCode === 401) {
      return {
        type: 'unauthorized',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        statusCode,
        canRetry: false,
        actionRequired: 'login',
      };
    }

    // Error 429: Rate limit
    if (statusCode === 429) {
      return {
        type: 'rate_limit',
        message: 'Has realizado demasiadas peticiones. Por favor, espera un momento e intenta nuevamente.',
        statusCode,
        canRetry: true,
        actionRequired: 'wait',
      };
    }

    // Error 500+: Error del servidor
    if (statusCode >= 500) {
      return {
        type: 'server',
        message: 'Error en el servidor. Nuestro equipo ha sido notificado. Por favor, intenta nuevamente en unos minutos.',
        statusCode,
        canRetry: true,
      };
    }

    // Error de red
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return {
        type: 'network',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        canRetry: true,
      };
    }

    // Error desconocido
    return {
      type: 'unknown',
      message: errorData?.error || err.message || 'Ocurrió un error inesperado al conectar con la IA.',
      statusCode,
      details: errorData,
      canRetry: true,
    };
  };

  const showErrorToast = (geminiError: GeminiError) => {
    const actions: Record<GeminiErrorType, () => void> = {
      no_credits: () => {
        toast({
          variant: "destructive",
          title: "Sin créditos",
          description: geminiError.message,
          action: geminiError.actionRequired === 'configure_token' ? (
            <Button
              onClick={() => navigate('/settings/tokens')}
              className="px-3 py-2 text-sm bg-white text-black rounded-md hover:bg-gray-100"
            >
              Configurar Token
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/billing/purchase')}
              className="px-3 py-2 text-sm bg-white text-black rounded-md hover:bg-gray-100"
            >
              Comprar Créditos
            </Button>
          ),
        });
      },
      unauthorized: () => {
        toast({
          variant: "destructive",
          title: "Sesión expirada",
          description: geminiError.message,
          action: (
            <Button
              onClick={() => navigate('/login')}
              className="px-3 py-2 text-sm bg-white text-black rounded-md hover:bg-gray-100"
            >
              Iniciar Sesión
            </Button>
          ),
        });
      },
      rate_limit: () => {
        toast({
          variant: "destructive",
          title: "Demasiadas peticiones",
          description: geminiError.message,
        });
      },
      network: () => {
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: geminiError.message,
        });
      },
      server: () => {
        toast({
          variant: "destructive",
          title: "Error del servidor",
          description: geminiError.message,
        });
      },
      unknown: () => {
        toast({
          variant: "destructive",
          title: "Error inesperado",
          description: geminiError.message,
        });
      },
    };

    actions[geminiError.type]();
  };

  const handleImprove = async (
    title: string,
    description: string,
    projectContext?: { name: string; description: string },
    model?: string,
    provider: string = 'gemini',
  ): Promise<boolean> => {
    setLoading(true);
    setImprovedText("");
    setError(null);

    // Guardar parámetros para retry
    setLastRequest({ title, description, projectContext, model });

    try {
      // Construir prompt con contexto
      const contextPrompt = projectContext 
        ? `Contexto del Proyecto:\n- Nombre: ${projectContext.name}\n- Descripción del Proyecto: ${projectContext.description}\n\n`
        : "";

      const finalPrompt = `${contextPrompt}Por favor, mejora y clarifica el siguiente Título y Descripción de una TAREA dentro de este proyecto. Asegúrate de que sea profesional y fácil de entender para el equipo.\n\nTítulo de la Tarea: ${title}\nDescripción actual: ${description}`;

      const response = await api.post<{ 
        respuesta: string;
        billing?: {
          used_custom_token: boolean;
          credits_consumed: number;
        };
      }>("/api/tasks/generate", {
        prompt: finalPrompt,
        model: model || "gemini-2.5-flash",
        provider,
      });

      const improvedContent = response.data.respuesta || "No se recibió texto.";
      setImprovedText(improvedContent);

      // Mostrar notificación de éxito con info de billing
      if (response.data.billing) {
        const billingInfo = response.data.billing;
        toast({
          title: "Texto mejorado exitosamente",
          description: billingInfo.used_custom_token
            ? "Se usó tu token personal de Gemini"
            : `Se consumió ${billingInfo.credits_consumed} crédito`,
        });
      } else {
        toast({
          title: "Texto mejorado exitosamente",
          description: "Tu tarea ha sido mejorada por IA",
        });
      }

      return true;
    } catch (err: any) {
      console.error("Error al llamar a la IA:", err);
      
      const geminiError = parseError(err);
      setError(geminiError);
      showErrorToast(geminiError);
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const retry = async (): Promise<boolean> => {
    if (!lastRequest) {
      console.warn('No hay petición anterior para reintentar');
      return false;
    }

    return handleImprove(
      lastRequest.title,
      lastRequest.description,
      lastRequest.projectContext,
      lastRequest.model
    );
  };

  return { 
    improvedText, 
    loading, 
    error,
    handleImprove,
    clearError,
    retry,
  };
};
