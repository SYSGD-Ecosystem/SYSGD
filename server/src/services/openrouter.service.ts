// services/openrouter.service.ts
import AWS from 'aws-sdk';
import { toPublicFileUrl } from './s3';
import { randomUUID } from 'crypto';
import https from 'https';

// Interfaces compartidas
export interface AgentRequest {
  prompt: string;
  image?: string;
  audio?: string;
  video?: string;
  file?: string;
  model?: string;
  customToken?: string;
}

export interface AgentResponse {
  respuesta: string;
  response?: string;
  message?: string;
  attachment_type?: "image" | "audio" | "video" | "file" | string | null;
  attachment_url?: string | null;
  metadata?: {
    type: 'text' | 'image';
    model: string;
    confidence: number;
    reasoning: string;
  };
}

export interface RequestAnalysis {
  type: 'text' | 'image';
  confidence: number;
  reasoning: string;
}

// Configuración
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_BASE = "https://openrouter.ai/api/v1";

// Validación de API Key
if (!OPENROUTER_API_KEY) {
  console.error("❌ ADVERTENCIA: OPENROUTER_API_KEY no configurada");
}

// Configuración de S3
const s3 = new AWS.S3({
  endpoint: process.env.AWS_ENDPOINT,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'sysgd-uploads';

/**
 * SERVICIO PRINCIPAL DE OPENROUTER
 * Contiene toda la lógica de negocio para interactuar con OpenRouter
 */
class OpenRouterService {
  
  /**
   * Analiza el prompt para determinar si requiere texto o imagen
   */
  async analyzeRequest(prompt: string): Promise<RequestAnalysis> {
    try {
      // Análisis simple basado en palabras clave (puedes mejorarlo con IA)
      const imageKeywords = [
        'imagen', 'foto', 'dibujo', 'ilustración', 'genera una imagen',
        'crea una imagen', 'dibuja', 'pinta', 'visualiza', 'muestra',
        'diseña', 'imagen de', 'picture', 'image', 'draw', 'create image'
      ];

      const lowerPrompt = prompt.toLowerCase();
      const isImageRequest = imageKeywords.some(keyword => 
        lowerPrompt.includes(keyword)
      );

      if (isImageRequest) {
        return {
          type: 'image',
          confidence: 0.8,
          reasoning: 'Detectadas palabras clave de generación de imagen'
        };
      }

      return {
        type: 'text',
        confidence: 0.9,
        reasoning: 'Petición de texto estándar'
      };
    } catch (error) {
      console.error('Error analizando request:', error);
      return {
        type: 'text',
        confidence: 0.5,
        reasoning: 'Error en análisis, usando texto por defecto'
      };
    }
  }

  /**
   * Genera una respuesta de texto usando OpenRouter
   */
  async generateTextResponse(
    prompt: string, 
    model: string = "openai/gpt-oss-120b:free",
    customToken?: string
  ): Promise<string> {
    const apiKey = customToken || OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('API Key de OpenRouter no disponible');
    }

    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://sysgd.netlify.app",
        "X-Title": "SYSGD",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Genera una imagen usando OpenRouter
   */
  async generateImage(
    prompt: string, 
    model: string = "google/gemini-2.5-flash-image-preview",
    customToken?: string
  ): Promise<string> {
    const apiKey = customToken || OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('API Key de OpenRouter no disponible');
    }

    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://sysgd.netlify.app",
        "X-Title": "SYSGD",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        modalities: ["text", "image"],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter image error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Extrae la URL de la imagen (ajusta según respuesta real de OpenRouter)
    const imageUrl = data.choices[0].message.content[0]?.image?.url 
      || data.choices[0].message.content;

    // Subir a S3 si es necesario
    if (imageUrl.startsWith('data:')) {
      return await this.uploadBase64ToS3(imageUrl, prompt);
    }

    return imageUrl;
  }

  /**
   * Descarga una imagen desde URL y la sube a S3
   */
  private async downloadAndUploadToS3(imageUrl: string, prompt: string): Promise<string> {
    try {
      console.log('📥 Descargando imagen desde:', imageUrl);
      const imageBuffer = await this.downloadImage(imageUrl);

      const imageId = randomUUID();
      const key = `generated-images/${imageId}.png`;

      const uploadParams = {
        Bucket: S3_BUCKET,
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/png',
        ACL: 'public-read' as const,
        Metadata: {
          prompt: prompt.substring(0, 255),
          generatedAt: new Date().toISOString(),
          model: 'openrouter',
          'upload-type': 'generated-image'
        }
      };

      const result = await s3.upload(uploadParams).promise();
      console.log('✅ Imagen subida a S3:', result.Location);

      return toPublicFileUrl(result.Location);
    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      throw new Error('Error guardando imagen en S3');
    }
  }

  /**
   * Sube imagen base64 a S3
   */
  private async uploadBase64ToS3(base64Data: string, prompt: string): Promise<string> {
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Formato base64 inválido');
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const imageId = randomUUID();
    const key = `generated-images/${imageId}.png`;

    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png',
      ACL: 'public-read' as const,
      Metadata: {
        prompt: prompt.substring(0, 255),
        generatedAt: new Date().toISOString(),
        model: 'openrouter'
      }
    };

      const result = await s3.upload(uploadParams).promise();
      return toPublicFileUrl(result.Location);
  }

  /**
   * Descarga una imagen desde una URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Error descargando imagen: ${res.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * MÉTODO PRINCIPAL - Procesa la petición del agente
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const { prompt, model, customToken } = request;

    if (!prompt) {
      throw new Error('El prompt es requerido');
    }

    try {
      // 1. Analizar la petición
      const analysis = await this.analyzeRequest(prompt);
      console.log('📊 Análisis:', analysis);

      let respuesta: string;
      let attachment_type: "image" | null = null;
      let attachment_url: string | null = null;

      // 2. Procesar según el tipo
      if (analysis.type === 'image' && analysis.confidence > 0.6) {
        const imageUrl = await this.generateImage(prompt, model, customToken);
        respuesta = "Imagen generada exitosamente";
        attachment_type = "image";
        attachment_url = imageUrl;
      } else {
        respuesta = await this.generateTextResponse(
          prompt, 
          model || "openai/gpt-oss-120b:free",
          customToken
        );
      }

      return {
        respuesta,
        attachment_type,
        attachment_url,
        metadata: {
          type: analysis.type,
          model: attachment_type ? 'openrouter-image' : (model || 'openai/gpt-oss-120b:free'),
          confidence: analysis.confidence,
          reasoning: analysis.reasoning
        }
      };
    } catch (error) {
      console.error('❌ Error en OpenRouter Service:', error);
      throw error;
    }
  }
}

// Exportar instancia única (Singleton)
export const openRouterService = new OpenRouterService();

// Exportar también la clase por si necesitas instancias múltiples
export default OpenRouterService;