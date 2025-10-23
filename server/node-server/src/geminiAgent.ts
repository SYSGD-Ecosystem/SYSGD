import AWS from 'aws-sdk';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
 * Sube una imagen a S3 y devuelve la URL (compatible con AWS SDK v2)
 */
async function uploadImageToS3(imageData: string, prompt: string): Promise<string> {
  try {
    // Generar nombre único para la imagen
    const imageId = randomUUID();
    const key = `generated-images/${imageId}.png`;

    // Decodificar base64 si es necesario
    let buffer: Buffer;
    if (imageData.startsWith('data:image')) {
      // Es un data URL
      const base64Data = imageData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Asumir que es base64 directo
      buffer = Buffer.from(imageData, 'base64');
    }

    // Subir a S3 usando AWS SDK v2 (igual que en upload.controller.ts)
    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      ACL: 'public-read', // Hacer la imagen pública como en upload.controller.ts
      Metadata: {
        prompt: prompt.substring(0, 255),
        generatedAt: new Date().toISOString(),
        model: 'gemini-2.5-flash-image',
        'upload-type': 'generated-image' // Para diferenciar de uploads normales
      }
    };

    const result = await s3.upload(uploadParams).promise();

    // Usar result.Location como en upload.controller.ts
    const imageUrl = result.Location;
    console.log('✅ Imagen subida a S3:', imageUrl);

    return imageUrl;

  } catch (error) {
    console.error('Error subiendo imagen a S3:', error);
    throw new Error('Error guardando imagen en S3');
  }
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

  Responde SOLO con un JSON en este formato:
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
export async function analyzeRequest(prompt: string): Promise<{type: 'text' | 'image', confidence: number, reasoning: string}> {
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
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPTS.text
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Genera una imagen real usando Gemini
 */
export async function generateImage(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image"
  });

  try {
    console.log('🎨 Generando imagen con Gemini:', prompt);

    const result = await model.generateContent(prompt);
    const response = result.response;

    console.log('📊 Respuesta de Gemini:', typeof response, Object.keys(response || {}));

    // Gemini puede devolver la imagen de diferentes formas
    let imageData: string | null = null;

    // Método 1: Como data URL base64
    if (response.imageData) {
      imageData = response.imageData;
    }
    // Método 2: En el texto de la respuesta (si Gemini describe la imagen)
    else if (response.text && response.text.includes('data:image')) {
      imageData = response.text;
    }
    // Método 3: Gemini podría generar la imagen y devolver una URL
    else if (response.imageUrl) {
      return response.imageUrl;
    }

    if (imageData) {
      // Subir a S3 y devolver URL
      const imageUrl = await uploadImageToS3(imageData, prompt);
      console.log('✅ Imagen procesada y subida:', imageUrl);
      return imageUrl;
    } else {
      // Si no hay imagen, generar una descripción como fallback
      console.log('⚠️ No se recibió imagen, generando descripción como fallback');
      return await generateTextResponse(`Describe en detalle la imagen que se generaría para: ${prompt}`);
    }

  } catch (error) {
    console.error('❌ Error generando imagen con Gemini:', error);

    // Si el modelo de imagen no está disponible, hacer fallback a descripción
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      console.log('🔄 Fallback: modelo de imagen no disponible, usando descripción');
      return await generateTextResponse(`Describe en detalle la imagen que se generaría para: ${prompt}`);
    }

    throw new Error('Error generando imagen con Gemini');
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

    if (analysis.type === 'image' && analysis.confidence > 0.6) {
      // 2. Si es imagen, generar imagen real y subir a S3
      response = await generateImage(prompt);
      responseType = 'image';
    } else {
      // 3. Si es texto, generar respuesta normal
      response = await generateTextResponse(prompt);
      responseType = 'text';
    }

    return {
      respuesta: response,
      metadata: {
        type: responseType,
        model: responseType === 'image' ? 'gemini-2.5-flash-image' : 'gemini-1.5-flash',
        confidence: analysis.confidence,
        reasoning: analysis.reasoning
      }
    };

  } catch (error) {
    console.error('Error procesando la petición del agente:', error);
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
