import { AgentsChatInterface } from "../components/agents-chat-interface";
import { ChatProvider } from "../hooks/useChatContext";

export default function AgentsChatPage() {
	return (
		<ChatProvider>
			<AgentsChatInterface />
		</ChatProvider>
	);
}
