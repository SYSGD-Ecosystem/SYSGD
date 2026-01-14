import { useEffect, useState } from "react";
import type {
	Agent,
	AgentMessageRequest,
	CreateAgentRequest,
	UpdateAgentRequest,
} from "../../types/Agent";
import api from "@/lib/api";

interface AgentExternalResponse {
	respuesta?: string;
	response?: string;
	message?: string;
	[key: string]: unknown;
}

export const useAgents = () => {
	const [agents, setAgents] = useState<Agent[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const fetchAgents = async (): Promise<Agent[]> => {
		setLoading(true);
		setError(null);
		try {
			const { data } = await api.get<Agent[]>("/api/agents");
			setAgents(Array.isArray(data) ? data : []);
			return data;
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Error desconocido");
			}
			throw err;
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
			const { data } = await api.post<Agent>("/api/agents", agentData);
			setAgents((prev) => [data, ...prev]);
			return data;
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Error desconocido");
			}
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
			const { data } = await api.put<Agent>(`/api/agents/${id}`, agentData);
			setAgents((prev) =>
				prev.map((agent) => (agent.id === id ? data : agent)),
			);
			return data;
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Error desconocido");
			}
			return null;
		} finally {
			setLoading(false);
		}
	};

	const deleteAgent = async (id: string): Promise<boolean> => {
		setLoading(true);
		setError(null);
		try {
			await api.delete<void>(`/api/agents/${id}`);
			setAgents((prev) => prev.filter((agent) => agent.id !== id));
			return true;
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Error desconocido");
			}
			return false;
		} finally {
			setLoading(false);
		}
	};

	const sendMessageToAgent = async (messageData: AgentMessageRequest) => {
		setLoading(true);
		setError(null);
		try {
			const agent = agents.find((a) => a.id === messageData.agent_id);
			if (!agent) {
				throw new Error("Agente no encontrado");
			}

			const agentRequest: {
				prompt?: string;
				systemPrompt?: string;
				image?: string;
				audio?: string;
				video?: string;
				file?: string;
			} = {
				prompt: messageData.content,
				systemPrompt: (agent as any).system_prompt || "",
			};

			if (messageData.attachment_type && messageData.attachment_url) {
				switch (messageData.attachment_type) {
					case "image":
						agentRequest.image = messageData.attachment_url;
						break;
					case "audio":
						agentRequest.audio = messageData.attachment_url;
						break;
					case "video":
						agentRequest.video = messageData.attachment_url;
						break;
					case "file":
						agentRequest.file = messageData.attachment_url;
						break;
				}
			}

			const { data: agentResponse } = await api.post<AgentExternalResponse>(
				agent.url,
				agentRequest,
			);

			const agentResponseContent =
				agentResponse.respuesta ??
				agentResponse.response ??
				agentResponse.message ??
				"Sin respuesta del agente";

			const { data: serverResult } = await api.post(
				"/api/agents/message",
				{
					...messageData,
					agent_response: agentResponseContent,
				},
			);

			return serverResult;
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Error desconocido");
			}
			return null;
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAgents().catch(() => {});
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
