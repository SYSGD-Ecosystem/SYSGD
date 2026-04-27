import { useEffect, useState } from "react";
import type {
	Agent,
	AgentMessageRequest,
	CreateAgentRequest,
	UpdateAgentRequest,
} from "../../types/Agent";
import api from "@/lib/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
	type ErrorWithResponse = {
		message?: string;
		response?: {
			data?: {
				message?: string;
				error?: string;
				details?: string;
			};
		};
	};
	const candidate = err as ErrorWithResponse;
	if (
		typeof candidate === "object" &&
		candidate !== null &&
		typeof candidate.response === "object" &&
		candidate.response !== null
	) {
		const data = candidate.response.data;
		return (
			data?.message || data?.error || data?.details || candidate.message || fallback
		);
	}
	if (err instanceof Error) return err.message;
	return fallback;
};

export const useAgents = () => {
	const [agents, setAgents] = useState<Agent[]>([]);
	const [publicAgents, setPublicAgents] = useState<Agent[]>([]);
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
			setPublicAgents((prev) =>
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
			setPublicAgents((prev) => prev.filter((agent) => agent.id !== id));
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

	const fetchPublicAgents = async (
		search = "",
		support = "",
	): Promise<Agent[]> => {
		setLoading(true);
		setError(null);
		try {
			const { data } = await api.get<Agent[]>("/api/agents/public", {
				params: {
					...(search.trim() ? { q: search.trim() } : {}),
					...(support.trim() ? { support: support.trim() } : {}),
				},
			});
			const safeData = Array.isArray(data) ? data : [];
			setPublicAgents(safeData);
			return safeData;
		} catch (err: unknown) {
			const message = getErrorMessage(
				err,
				"Error al obtener agentes públicos",
			);
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const sendMessageToAgent = async (messageData: AgentMessageRequest) => {
		setLoading(true);
		setError(null);
		try {
			const { data: serverResult } = await api.post(
				"/api/agents/message",
				messageData,
			);

			return serverResult;
		} catch (err: unknown) {
			const message = getErrorMessage(err, "Error al enviar mensaje al agente");
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAgents().catch(() => {});
	}, []);

	return {
		agents,
		publicAgents,
		loading,
		error,
		fetchAgents,
		fetchPublicAgents,
		createAgent,
		updateAgent,
		deleteAgent,
		sendMessageToAgent,
	};
};
