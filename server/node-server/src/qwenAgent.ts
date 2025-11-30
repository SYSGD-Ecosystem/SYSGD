// System prompts para diferentes tipos de tareas
const SYSTEM_PROMPTS = {
	text: `Eres un asistente de IA inteligente y útil. Proporciona respuestas claras, precisas y bien estructuradas.
  - Si te piden información, sé informativo y detallado.
  - Si te piden análisis, sé crítico y objetivo.
  - Si te preguntan tu nombre te llamas Wanda.
  - Si te saludan siempre responderas presentandote y diciendo tu nombre.
  - Responde siempre en español.
  - Siempre que te pregunten algo, debes argumentar tu respuesta.
  - Limitaras tus respuestas a no mas de 1000 letras.
  - Si no sabes algo responde que no tienes datos suficicientes.
  - Mantén un tono profesional pero amigable.`,
};

// Interface para las peticiones del agente
export interface AgentRequest {
	prompt: string;
}

// Interface para las respuestas del agente
export interface AgentResponse {
	respuesta: string;
	response?: string;
	message?: string;
	attachment_type?: "image" | "audio" | "video" | "file" | string | null;
	attachment_url?: string | null;
	metadata?: {
		type: "text" | "image";
		model: string;
		confidence: number;
		reasoning: string;
	};
}

export interface QwenResponse {
    model: string,
    create_at: string,
    response: string,
    done: boolean,
    done_reason: string,
    context: number[],
    total_duration: number,
    load_duration: number,
    prompt_eval_count:number,
    prompt_eval_duration: number,
    eval_count: number,
    eval_duration: number,
}

/**
 * Genera una respuesta de texto usando Qwen
 */
export async function generateTextResponse(prompt: string): Promise<string> {
	const result = await fetch("http://localhost:11434/api/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: "qwen3:0.6b",
			system: SYSTEM_PROMPTS.text,
			prompt,
			think: false,
			stream: false,
		}),
	});

	return result.text();
}

/**
 * Procesa una petición del agente de manera inteligente
 */
export async function processAgentRequest(
	request: AgentRequest,
): Promise<AgentResponse> {
	const { prompt } = request;

	if (!prompt) {
		throw new Error("El prompt es requerido");
	}

	try {
		let response: string;
		let responseType: "text" | "image";
		let attachment_type: "image" | "audio" | "video" | "file" | string | null;
		let attachment_url: string | null;

		response = await generateTextResponse(prompt);
        console.log({response})

        const qwenResponse: QwenResponse = JSON.parse(response);


		responseType = "text";
		attachment_type = null;
		attachment_url = null;

		return {
			respuesta: qwenResponse.response,
			attachment_type,
			attachment_url,
			metadata: {
				type: responseType,
				model: "qwen3:0.6b",
				confidence: 0,
				reasoning: "",
			},
		};
	} catch (error) {
		console.error("❌ Error procesando la petición del agente:", error);
		throw new Error("Error interno del agente");
	}
}

/**
 * Función principal del agente - compatible con el protocolo del sistema
 */
export async function qwenAgent(request: AgentRequest): Promise<AgentResponse> {
	console.log("🤖 Qwen Agent procesando:", request.prompt);

	const result = await processAgentRequest(request);

	console.log("✅ Qwen Agent respuesta generada:", {
		type: result.metadata?.type,
		length: result.respuesta.length,
	});

	return result;
}
