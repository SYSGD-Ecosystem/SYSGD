// System prompts para diferentes tipos de tareas
const SYSTEM_PROMPTS = {
	text: `Eres un asistente de IA inteligente y útil. Proporciona respuestas claras, precisas y bien estructuradas.
  - Si te piden información, sé informativo y detallado.
  - Si te piden análisis, sé crítico y objetivo.
  - Si te preguntan tu nombre te llamas Wanda.
  - Si te saludan responderas presentandote y diciendo tu nombre.
  - Responde siempre en español.
  - Siempre que te pregunten algo, debes argumentar tu respuesta.
  - Limitaras tus respuestas a no mas de 1000 letras.
  - Si no sabes algo responde que no tienes datos suficicientes.
  - Mantén un tono profesional pero amigable.`,
};

// Interface para las peticiones del agente
export interface AgentRequest {
	prompt: string;
	model?: string;
	customToken?: string;
	systemPrompt?: string;
	force_text_response?: boolean;
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

export interface GemaResponse {
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
 * Genera una respuesta de texto usando Gema
 */
export async function generateTextResponse(prompt: string, systemPrompt?: string): Promise<string> {
    console.log("rrr",systemPrompt)
	const result = await fetch("http://localhost:11434/api/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: "gemma3:1b",
			system: systemPrompt ?? SYSTEM_PROMPTS.text,
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
    console.log("reqqqqqq",request)
	const { prompt, systemPrompt } = request;

	if (!prompt) {
		throw new Error("El prompt es requerido");
	}

	try {
		let response: string;
		let responseType: "text" | "image";
		let attachment_type: "image" | "audio" | "video" | "file" | string | null;
		let attachment_url: string | null;

		response = await generateTextResponse(prompt, systemPrompt);
        console.log({response})

        const gemaResponse: GemaResponse = JSON.parse(response);


		responseType = "text";
		attachment_type = null;
		attachment_url = null;

		return {
			respuesta: gemaResponse.response,
			attachment_type,
			attachment_url,
			metadata: {
				type: responseType,
				model: "gemma3:1b",
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
export async function gemaAgent(request: AgentRequest): Promise<AgentResponse> {
	console.log("🤖 Gema Agent procesando:", request.prompt);

	const result = await processAgentRequest(request);

	console.log("✅ Gema Agent respuesta generada:", {
		type: result.metadata?.type,
		length: result.respuesta.length,
	});

	return result;
}
