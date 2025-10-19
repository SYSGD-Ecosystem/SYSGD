import { useState, useEffect } from "react";
import type { ExtendedMessage } from "../components/chat-conversation";

export function useMessages(conversationId: string) {
	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
	const [messages, setMessages] = useState<ExtendedMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchMessages() {
			if (!conversationId) return;
			try {
				setLoading(true);
				const res = await fetch(
					`${serverUrl}/api/chat/messages/${conversationId}`,
					{
						credentials: "include",
					},
				);
				if (!res.ok) throw new Error("Error al cargar mensajes");
				const data = await res.json();
				setMessages(data);
			} catch (err: any) {
				setError(err.message || "Error desconocido");
			} finally {
				setLoading(false);
			}
		}

		fetchMessages();
	}, [conversationId]);

	const sendMessage = async (message: {
		sender_id: number;
		content: string;
		attachment_type?: string;
		attachment_url?: string;
		reply_to?: string;
	}) => {
		try {
			const res = await fetch(`/api/chat/messages/send`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ conversation_id: conversationId, ...message }),
			});
			if (!res.ok) throw new Error("Error al enviar mensaje");
			const newMessage = await res.json();
			setMessages((prev) => [...prev, newMessage]);
			return newMessage;
		} catch (err: any) {
			setError(err.message || "Error desconocido");
		}
	};

	return { messages, loading, error, sendMessage, setMessages };
}
