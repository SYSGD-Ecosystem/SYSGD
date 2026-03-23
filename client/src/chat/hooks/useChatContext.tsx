import { createContext, useContext, type PropsWithChildren } from "react";
import { useChat } from "./useChat";

type ChatContextValue = ReturnType<typeof useChat>;

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: PropsWithChildren) {
	const chat = useChat();
	return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChatContext debe usarse dentro de ChatProvider");
	}
	return context;
}
