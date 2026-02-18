import { ChatInterface } from "../components/chat-interface";
import { ChatProvider } from "../hooks/useChatContext";
import { SocketProvider } from "../hooks/useSocket";

export default function HomeChat() {
	return (
		<SocketProvider>
			<ChatProvider>
				<ChatInterface />
			</ChatProvider>
		</SocketProvider>
	);
}
