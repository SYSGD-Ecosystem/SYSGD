// funcion para llamar a taskAgent

import { generate } from "./openrouterai.service";

const taskAgent = (provider: string, model: string, prompt: string) => {
	const systemPrompt = `Eres un asistente de IA inteligente y útil. Proporciona respuestas claras, precisas y bien estructuradas.
Si te piden información, sé informativo y detallado.
Si te piden análisis, sé crítico y objetivo.
Mantén un tono profesional pero amigable.
En caso de entender que te están enviando una tarea para un proyecto deberás responder de forma limpia sin explicaciones adicionales al usuario, solo respondiendo en base al título de la tarea y la descripción pero sin hablar con el usuario ya que tu función aquí será mejorar la descripción de una tarea, en estos casos también evaluar prioridad y complejidad de la tarea, enviar sugerencias de solución para la tarea`;

	switch (provider) {
		case "Google":
		case "gemini": {
			switch (model) {
			}
			return;
		}
		case "openrouter":
			return generate(model, prompt, systemPrompt);
	}
};

export { taskAgent };
