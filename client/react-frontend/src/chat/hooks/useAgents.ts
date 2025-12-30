import { useEffect, useState } from "react";
import type {
	Agent,
	AgentMessageRequest,
	CreateAgentRequest,
	UpdateAgentRequest,
} from "../../types/Agent";

const API_BASE_URL = "http://localhost:3000/api/agents";

export const useAgents = () => {
	const [agents, setAgents] = useState<Agent[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchAgents = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(API_BASE_URL, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error("Error al obtener los agentes");
			}

			const data = await response.json();
			console.log("📊 Agentes cargados:", data); // Debug info
			setAgents(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setLoading(false);
		}
	};

	const createAgent = async (
		agentData: CreateAgentRequest,
	): Promise<Agent | null> => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(API_BASE_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify(agentData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al crear el agente");
			}

			const newAgent = await response.json();
			setAgents((prev) => [newAgent, ...prev]);
			return newAgent;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
			return null;
		} finally {
			setLoading(false);
		}
	};

	const updateAgent = async (
		id: string,
		agentData: UpdateAgentRequest,
	): Promise<Agent | null> => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_BASE_URL}/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify(agentData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al actualizar el agente");
			}

			const updatedAgent = await response.json();
			setAgents((prev) =>
				prev.map((agent) => (agent.id === id ? updatedAgent : agent)),
			);
			return updatedAgent;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
			return null;
		} finally {
			setLoading(false);
		}
	};

	const deleteAgent = async (id: string): Promise<boolean> => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_BASE_URL}/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al eliminar el agente");
			}

			setAgents((prev) => prev.filter((agent) => agent.id !== id));
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
			return false;
		} finally {
			setLoading(false);
		}
	};

	const sendMessageToAgent = async (messageData: AgentMessageRequest) => {
		setLoading(true);
		setError(null);
		try {
			// Obtener el agente para acceder a su URL
			const agent = agents.find((a) => a.id === messageData.agent_id);
			if (!agent) {
				throw new Error("Agente no encontrado");
			}

			// Preparar la petición al agente
			const agentRequest = {
				prompt: messageData.content,
				...(messageData.attachment_type === "image" &&
					messageData.attachment_url && {
						image: messageData.attachment_url,
					}),
				...(messageData.attachment_type === "audio" &&
					messageData.attachment_url && {
						audio: messageData.attachment_url,
					}),
				...(messageData.attachment_type === "video" &&
					messageData.attachment_url && {
						video: messageData.attachment_url,
					}),
				...(messageData.attachment_type === "file" &&
					messageData.attachment_url && {
						file: messageData.attachment_url,
					}),
			};

			console.log("Enviando petición al agente:", agentRequest);

			// Enviar petición directamente al agente desde el cliente
			const agentResponse = await fetch(agent.url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(agentRequest),
				credentials: "include",
			});

			if (!agentResponse.ok) {
				throw new Error(`Agente respondió con error: ${agentResponse.status}`);
			}

			const agentData = await agentResponse.json();
			console.log("Respuesta del agente:", agentData);
			const agentResponseContent =
				agentData.respuesta ||
				agentData.response ||
				agentData.message ||
				"Sin respuesta del agente";

			// Ahora enviar el mensaje del usuario y la respuesta del agente al servidor
			const serverResponse = await fetch(`${API_BASE_URL}/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					...messageData,
					agent_response: agentResponseContent,
				}),
			});

			if (!serverResponse.ok) {
				const errorData = await serverResponse.json();
				throw new Error(
					errorData.error || "Error al guardar mensajes en el servidor",
				);
			}

			const result = await serverResponse.json();
			return result;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
			return null;
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAgents();
	}, []);

	return {
		agents,
		loading,
		error,
		fetchAgents,
		createAgent,
		updateAgent,
		deleteAgent,
		sendMessageToAgent,
	};
};
