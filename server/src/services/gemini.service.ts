// services/gemini.service.ts
import AWS from 'aws-sdk';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Replicate from 'replicate';
import https from 'https';

// Interfaces compartidas (considera moverlas a un archivo types.ts)
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

// Configuración
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const s3 = new AWS.S3({
  endpoint: process.env.AWS_ENDPOINT,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'sysgd-uploads';

// System prompts
const SYSTEM_PROMPTS = {
  text: `Eres un asistente de IA inteligente y útil. Proporciona respuestas claras, precisas y bien estructuradas.
Si te piden información, sé informativo y detallado.
Si te piden análisis, sé crítico y objetivo.
Mantén un tono profesional pero amigable.
En caso de entender que te están enviando una tarea para un proyecto deberás responder de forma limpia sin explicaciones adicionales al usuario, solo respondiendo en base al título de la tarea y la descripción pero sin hablar con el usuario ya que tu función aquí será mejorar la descripción de una tarea, en estos casos también evaluar prioridad y complejidad de la tarea, enviar sugerencias de solución para la tarea`,

  analyzer: `Eres un analizador de peticiones que determina si el usuario quiere generar una imagen real o recibir una respuesta de texto.

REGLAS DE CLASIFICACIÓN:

PEDIR IMAGEN cuando el usuario use palabras como:
- "crea una imagen", "genera una imagen", "dibuja", "pinta"
- "muéstrame una foto", "visualiza", "imagina visualmente"
- "genera una imagen de", "crea una foto de"
- "diseña", "ilustra", "representa visualmente"
- "muestra cómo se ve", "qué aspecto tiene"

PEDIR TEXTO para todo lo demás:
- Preguntas informativas ("¿qué es?", "¿cómo funciona?")
- Explicaciones, análisis, descripciones
- Conversaciones normales
- Instrucciones, guías, tutoriales

Responde SOLO con un JSON en este formato sin comillas invertidas o markdown:
{
  "type": "text" | "image",
  "confidence": 0.0-1.0,
  "reasoning": "explicación breve de por qué clasificaste así"
}`
};

/**
 * SERVICIO DE GEMINI
 * Maneja toda la lógica de negocio relacionada con Gemini y Replicate
 */
class GeminiService {

  /**
   * Analiza el prompt del usuario para determinar el tipo de respuesta
   */
  async analyzeRequest(prompt: string): Promise<{ type: 'text' | 'image', confidence: number, reasoning: string }> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const fullPrompt = `${SYSTEM_PROMPTS.analyzer}\n\nMensaje del usuario: "${prompt}"`;

    try {
      const result = await model.generateContent(fullPrompt);
      const response = result.response.text();
      console.log('📊 Análisis de la petición:', response);

      const analysis = JSON.parse(response.trim());

      return {
        type: analysis.type || 'text',
        confidence: analysis.confidence || 0.5,
        reasoning: analysis.reasoning || 'Análisis automático'
      };
    } catch (error) {
      console.error('Error analizando la petición:', error);
      return {
        type: 'text',
        confidence: 0.3,
        reasoning: 'Error en análisis, usando texto por defecto'
      };
    }
  }

  /**
   * Genera una respuesta de texto usando Gemini
   */
  async generateTextResponse(prompt: string, model: string = "gemini-2.5-flash"): Promise<string> {
    const genModel = genAI.getGenerativeModel({
      model: model,
      systemInstruction: SYSTEM_PROMPTS.text
    });

    const result = await genModel.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Genera una imagen usando Replicate (reve/create)
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      console.log('🎨 Generando imagen con Replicate:', prompt);

      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN || ''
      });

      const input = { prompt };

      console.log('📤 Enviando a Replicate...');
      const output = await replicate.run("reve/create", { input });

      console.log('📥 Respuesta de Replicate:', output);

      if (output && typeof output === 'object' && typeof (output as any).url === 'function') {
        const outputWithUrl = output as { url: () => URL };
        const urlObject = outputWithUrl.url();
        const imageUrl = urlObject.href;

        console.log('🔄 Descargando y subiendo a S3...');
        return await this.downloadAndUploadToS3(imageUrl, prompt);
      } else {
        throw new Error('No se recibió objeto URL de Replicate');
      }
    } catch (error) {
      console.error('❌ Error generando imagen:', error);
      throw new Error('Error generando imagen');
    }
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
          model: 'replicate-reve-create',
          'upload-type': 'generated-image',
          'original-url': imageUrl
        }
      };

      console.log('📤 Subiendo imagen a S3:', key);
      const result = await s3.upload(uploadParams).promise();

      const finalImageUrl = result.Location;
      console.log('✅ Imagen subida a S3:', finalImageUrl);

      return finalImageUrl;
    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      throw new Error('Error guardando imagen en S3');
    }
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
   * MÉTODO PRINCIPAL - Procesa una petición del agente
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const { prompt, model } = request;

    if (!prompt) {
      throw new Error('El prompt es requerido');
    }

    try {
      // 1. Analizar la petición
      const analysis = await this.analyzeRequest(prompt);
      console.log('📊 Análisis:', analysis);

      let response: string;
      let responseType: 'text' | 'image';
      let attachment_type: 'image' | null;
      let attachment_url: string | null;

      // 2. Procesar según el tipo
      if (analysis.type === 'image' && analysis.confidence > 0.6) {
        response = await this.generateImage(prompt);
        responseType = 'image';
        attachment_type = 'image';
        attachment_url = response;
      } else {
        response = await this.generateTextResponse(prompt, model || "gemini-2.5-flash");
        responseType = 'text';
        attachment_type = null;
        attachment_url = null;
      }

      return {
        respuesta: response,
        attachment_type,
        attachment_url,
        metadata: {
          type: responseType,
          model: responseType === 'image' ? 'replicate-reve-create' : (model || 'gemini-2.5-flash'),
          confidence: analysis.confidence,
          reasoning: analysis.reasoning
        }
      };
    } catch (error) {
      console.error('❌ Error en Gemini Service:', error);
      throw error;
    }
  }
}

// Exportar instancia única
export const geminiService = new GeminiService();

// Exportar también la clase
export default GeminiService;