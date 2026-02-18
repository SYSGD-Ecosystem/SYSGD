// openRouterAgent.ts
import { AgentRequest, AgentResponse } from "./qwenAgent"; // Reusa las interfaces existentes

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// En tu analyzeRequest o en el system prompt del analyzer:

const imageGenerationKeywords = [
	"genera una imagen",
	"crea una imagen",
	"dibuja",
	"diseña una imagen",
	"crea un logo",
	"genera un gráfico",
	"haz un dibujo",
];

const imageQuestionKeywords = [
	"como inicialiso",
	"como inicializar",
	"que es esta imagen",
	"ayuda con imagen",
	"docker image",
	"contenedor",
];

// Si contiene palabras de pregunta → texto
// Solo si explícitamente pide generar → imagen

const API_BASE = "https://openrouter.ai/api/v1";

/**
 * Llama a OpenRouter para texto (chat completion)
 */
async function callOpenRouterChat(
	prompt: string,
	model: string = "openai/gpt-oss-120b:free",
	systemPrompt?: string,
	customToken?: string,
): Promise<string> {
	const token = customToken || OPENROUTER_API_KEY;

	if (!token) {
		throw new Error("No se encontró token de OpenRouter (usuario ni sistema)");
	}

	console.log("Using system:", systemPrompt);


console.log("Enviando esto...",{
			model,
			messages: systemPrompt
				? [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: prompt },
					]
				: [{ role: "user", content: prompt }],
			stream: false,
		})

	const response = await fetch(`${API_BASE}/chat/completions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			// Opcional: indica tu app para que aparezca en sus stats
			"HTTP-Referer": "https://sysgd.netlify.app",
			"X-Title": "SYSGD",
		},
		body: JSON.stringify({
			model,
			messages: systemPrompt
				? [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: prompt },
					]
				: [{ role: "user", content: prompt }],
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
 * Genera imagen con OpenRouter (usa modelos como google/gemini-flash-1.5 o openai/gpt-5-image)
 */
async function generateImageOpenRouter(
	prompt: string,
	model: string = "google/gemini-2.5-flash-image-preview",
 	customToken?: string,
): Promise<string> {
	const token = customToken || OPENROUTER_API_KEY;

	if (!token) {
		throw new Error("No se encontró token de OpenRouter (usuario ni sistema)");
	}

	const response = await fetch(`${API_BASE}/chat/completions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			"HTTP-Referer": "https://tu-app.com",
			"X-Title": "SYSGD Chat",
		},
		body: JSON.stringify({
			model,
			messages: [{ role: "user", content: prompt }],
			modalities: ["text", "image"], // Necesario para activar generación de imágenes
			max_tokens: 1000,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`OpenRouter image error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	// OpenRouter devuelve imágenes como data URLs base64
	const imageUrl = data.choices[0].message.content[0].image.url; // formato aproximado, ajusta si cambia
	return imageUrl;
}

/**
 * Procesa la petición del agente
 */
export async function processAgentRequest(
	request: AgentRequest,
): Promise<AgentResponse> {
	const { prompt, model, customToken, systemPrompt, force_text_response } = request;

	if (!prompt) {
		throw new Error("Prompt requerido");
	}

	try {
		let respuesta: string;
		let attachment_type: "image" | null = null;
		let attachment_url: string | null = null;

		// Detecta si pide imagen (puedes mejorar esta lógica con análisis como en geminiAgent)
		if (
			prompt.toLowerCase().includes("genera una imagen") &&
			!force_text_response
		) {
			const imageUrl = await generateImageOpenRouter(prompt, model, customToken);
			respuesta = "Aquí tienes la imagen generada:";
			attachment_type = "image";
			attachment_url = imageUrl;
		} else {
			respuesta = await callOpenRouterChat(prompt, "openai/gpt-oss-120b:free", systemPrompt, customToken); // Puedes cambiar el modelo aquí
		}

		return {
			respuesta,
			attachment_type,
			attachment_url,
			metadata: {
				type: attachment_type ? "image" : "text",
				model: attachment_type
					? "openrouter-image"
					: "openai/gpt-oss-120b:free",
				confidence: 0.9,
				reasoning: "Ruteado vía OpenRouter",
			},
		};
	} catch (error) {
		console.error("Error en OpenRouter Agent:", error);
		throw new Error("Error procesando con OpenRouter");
	}
}

/**
 * Función principal compatible con tu protocolo
 */
export async function openRouterAgent(
	request: AgentRequest,
): Promise<AgentResponse> {
	console.log("OpenRouter Agent procesando:", request.prompt);
	const result = await processAgentRequest(request);
	console.log("OpenRouter respuesta:", result);
	return result;
}
