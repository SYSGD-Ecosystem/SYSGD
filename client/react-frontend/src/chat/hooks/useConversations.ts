import { useState, useEffect } from "react";
import type { Chat } from "../components/chat-interface";

export function useConversations(userId: number) {
	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
	const [conversations, setConversations] = useState<Chat[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchConversations() {
			try {
				setLoading(true);
				const res = await fetch(
					`${serverUrl}/api/chat/conversations/${userId}`,
					{
						credentials: "include",
					},
				);
				if (!res.ok) throw new Error("Error al cargar conversaciones");
				const data = await res.json();
				setConversations(data);
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} catch (err: any) {
				setError(err.message || "Error desconocido");
			} finally {
				setLoading(false);
			}
		}

		fetchConversations();
	}, [userId]);

	return { conversations, loading, error, setConversations };
}
