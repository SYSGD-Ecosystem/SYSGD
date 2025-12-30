export interface Agent {
	id: string;
	name: string;
	url: string;
	support: AgentSupport[];
	description?: string;
	created_by: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export type AgentSupport = "text" | "image" | "audio" | "video";

export interface CreateAgentRequest {
	name: string;
	url: string;
	support: AgentSupport[];
	description?: string;
}

export interface UpdateAgentRequest {
	name?: string;
	url?: string;
	support?: AgentSupport[];
	description?: string;
	is_active?: boolean;
}

export interface AgentConversation {
	id: string;
	conversation_id: string;
	agent_id: string;
	created_at: string;
}

export interface AgentMessageRequest {
	agent_id: string;
	conversation_id: string;
	content: string;
	attachment_type?: "image" | "audio" | "video" | "file";
	attachment_url?: string;
	agent_response?: string; // Respuesta del agente (opcional, para cuando se envía desde el cliente)
}
