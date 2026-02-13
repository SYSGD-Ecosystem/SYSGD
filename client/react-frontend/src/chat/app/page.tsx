import { ChatInterface } from "../components/chat-interface";
import { ChatProvider } from "../hooks/useChatContext";

export default function HomeChat() {
	return (
		<ChatProvider>
			<ChatInterface />
		</ChatProvider>
	);
}
