import AWS from 'aws-sdk';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Replicate from 'replicate';
import https from 'https';
import { promisify } from 'util';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Configuración de S3 (usando AWS SDK v2 como en upload.controller.ts)
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
 * Descarga una imagen desde una URL y la sube a S3 (igual que upload.controller.ts)
 */
async function downloadImageAndUploadToS3(imageUrl: string, prompt: string): Promise<string> {
    try {
        console.log('📥 Descargando imagen desde:', imageUrl);

        // Descargar la imagen desde la URL
        const imageBuffer = await downloadImage(imageUrl);

        // Generar nombre único para la imagen
        const imageId = randomUUID();
        const fileExtension = '.png'; // Asumir PNG por defecto
        const key = `generated-images/${imageId}${fileExtension}`;

        // Subir a S3 usando la misma lógica que upload.controller.ts
        const uploadParams = {
            Bucket: S3_BUCKET,
            Key: key,
            Body: imageBuffer,
            ContentType: 'image/png',
            ACL: 'public-read', // Hacer la imagen pública
            Metadata: {
                prompt: prompt.substring(0, 255),
                generatedAt: new Date().toISOString(),
                model: 'replicate-google-imagen-4',
                'upload-type': 'generated-image',
                'original-url': imageUrl
            }
        };

        console.log('📤 Subiendo imagen a S3:', key);
        const result = await s3.upload(uploadParams).promise();

        // Usar result.Location como en upload.controller.ts
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
async function downloadImage(url: string): Promise<Buffer> {
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

// System prompts para diferentes tipos de tareas
const SYSTEM_PROMPTS = {
    text: `Eres un asistente de IA inteligente y útil. Proporciona respuestas claras, precisas y bien estructuradas.
  Si te piden información, sé informativo y detallado.
  Si te piden análisis, sé crítico y objetivo.
  Mantén un tono profesional pero amigable.`,

    image: `Eres un generador de imágenes con IA avanzada. Cuando recibas una solicitud para crear una imagen:

  1. **Analiza la solicitud** del usuario para entender qué imagen crear
  2. **Genera la imagen real** usando tus capacidades de generación de imágenes
  3. **Devuelve la imagen** en formato binario o base64 que el sistema pueda procesar

  El sistema se encargará automáticamente de:
  - Guardar la imagen en S3 (Amazon S3)
  - Generar una URL pública
  - Mostrar la imagen al usuario

  TIPOS DE IMÁGENES QUE PUEDES GENERAR:
  - Paisajes, ciudades, naturaleza
  - Personajes, animales, objetos
  - Escenas abstractas o artísticas
  - Imágenes realistas o estilizadas
  - Cualquier concepto visual que el usuario describa

  IMPORTANTE: Genera la imagen visual real, no solo texto descriptivo. El usuario recibirá la imagen que crees.`,

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

// Interface para las peticiones del agente
export interface AgentRequest {
    prompt: string;
    image?: string;
    audio?: string;
    video?: string;
    file?: string;
}

// Interface para las respuestas del agente
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

/**
 * Analiza el prompt del usuario para determinar el tipo de respuesta esperada
 */
export async function analyzeRequest(prompt: string): Promise<{ type: 'text' | 'image', confidence: number, reasoning: string }> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `${SYSTEM_PROMPTS.analyzer}\n\nMensaje del usuario: "${prompt}"`;

    try {
        const result = await model.generateContent(fullPrompt);
        console.log('Respuesta del modelo:', result.response.text());
        const response = result.response.text();

        console.log('Análisis de la petición:', response);

        // Parsear la respuesta JSON
        const analysis = JSON.parse(response.trim());

        return {
            type: analysis.type || 'text',
            confidence: analysis.confidence || 0.5,
            reasoning: analysis.reasoning || 'Análisis automático'
        };
    } catch (error) {
        console.error('Error analizando la petición:', error);
        // Fallback: si no puede analizar, asumir texto
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
export async function generateTextResponse(prompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPTS.text
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Genera una imagen usando Replicate y la sube a S3
 */
export async function generateImage(prompt: string): Promise<string> {
    try {
        console.log('🎨 Generando imagen con Replicate:', prompt);

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN || ''
        });

        const input = {
            prompt,
            aspect_ratio: "16:9",
            safety_filter_level: "block_medium_and_above"
        };

        console.log('📤 Enviando a Replicate...');
        const output = await replicate.run("google/imagen-4", { input });

        console.log('📥 Respuesta de Replicate:', output);

        // Replicate devuelve un objeto con método url()
        if (output && typeof output === 'object' && typeof output.url === 'function') {
            const urlObject = output.url();
            console.log('🔗 URL Object:', urlObject);

            // El objeto URL tiene una propiedad href con la URL completa
            const imageUrl = urlObject.href;
            console.log('📸 URL de imagen:', imageUrl);

            // Descargar la imagen y subirla a S3
            console.log('🔄 Descargando y subiendo a S3...');
            return await downloadImageAndUploadToS3(imageUrl, prompt);
        } else {
            throw new Error('No se recibió objeto URL de Replicate');
        }

    } catch (error) {
        console.error('❌ Error generando imagen con Replicate:', error);
        throw new Error('Error generando imagen');
    }
}


const generateImageFromReveCreate = async (prompt: string): Promise<string> => {
// usa replicate con reve/create para generar una imagen
try {
        console.log('🎨 Generando imagen con Replicate:', prompt);

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN || ''
        });

        const input = {
            prompt
        };

        console.log('📤 Enviando a Replicate...');
        const output = await replicate.run("reve/create", { input });

        console.log('📥 Respuesta de Replicate:', output);

        // Replicate devuelve un objeto con método url()
        if (output && typeof output === 'object' && typeof output.url === 'function') {
            const urlObject = output.url();
            console.log('🔗 URL Object:', urlObject);

            // El objeto URL tiene una propiedad href con la URL completa
            const imageUrl = urlObject.href;
            console.log('📸 URL de imagen:', imageUrl);

            // Descargar la imagen y subirla a S3
            console.log('🔄 Descargando y subiendo a S3...');
            return await downloadImageAndUploadToS3(imageUrl, prompt);
        } else {
            throw new Error('No se recibió objeto URL de Replicate');
        }

    } catch (error) {
        console.error('❌ Error generando imagen con Replicate:', error);
        throw new Error('Error generando imagen');
    }

}

/**
 * Procesa una petición del agente de manera inteligente
 */
export async function processAgentRequest(request: AgentRequest): Promise<AgentResponse> {
    const { prompt } = request;

    if (!prompt) {
        throw new Error('El prompt es requerido');
    }

    try {
        // 1. Analizar la petición
        const analysis = await analyzeRequest(prompt);
        console.log('Análisis de la petición:', analysis);

        let response: string;
        let responseType: 'text' | 'image';
        let attachment_type: 'image' | 'audio' | 'video' | 'file' | string | null;
        let attachment_url: string | null;

        if (analysis.type === 'image' && analysis.confidence > 0.6) {
            // 2. Si es imagen, generar imagen real y subir a S3
            response = await generateImageFromReveCreate(prompt);
            responseType = 'image';
            attachment_type = 'image';
            attachment_url = response;
        } else {
            // 3. Si es texto, generar respuesta normal
            response = await generateTextResponse(prompt);
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
                model: responseType === 'image' ? 'replicate-google-imagen-4' : 'gemini-2.5-flash',
                confidence: analysis.confidence,
                reasoning: analysis.reasoning
            }
        };

    } catch (error) {
        console.error('❌ Error procesando la petición del agente:', error);
        throw new Error('Error interno del agente');
    }
}

/**
 * Función principal del agente - compatible con el protocolo del sistema
 */
export async function geminiAgent(request: AgentRequest): Promise<AgentResponse> {
    console.log('🤖 Gemini Agent procesando:', request.prompt);

    const result = await processAgentRequest(request);

    console.log('✅ Gemini Agent respuesta generada:', {
        type: result.metadata?.type,
        length: result.respuesta.length
    });

    return result;
}
