export interface Agent {
  id: string;
  name: string;
  url: string;
  support: AgentSupport[];
  description?: string;
  created_by: number;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  system_prompt?: string;
  creator_name?: string;
  creator_email?: string;
}

export type AgentSupport = 'text' | 'image' | 'audio' | 'video';

export interface CreateAgentRequest {
  name: string;
  url: string;
  support: AgentSupport[];
  description?: string;
  systemPrompt?: string;
  is_public?: boolean;
}

export interface UpdateAgentRequest {
  name?: string;
  url?: string;
  support?: AgentSupport[];
  description?: string;
  is_active?: boolean;
  systemPrompt?: string;
  is_public?: boolean;
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
  attachment_type?: 'image' | 'audio' | 'video' | 'file';
  attachment_url?: string;
  agent_response?: string; // Respuesta del agente (opcional, para cuando se envía desde el cliente)
}
