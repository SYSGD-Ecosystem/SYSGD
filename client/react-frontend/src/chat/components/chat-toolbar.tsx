import { Home, MessageSquare, Plus } from "lucide-react";
import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Conversation } from "../hooks/useChat";
import { NewChatModal } from "./new-chat-modal";

interface ChatToolbarProps {
	selectedChat?: Conversation;
	onGoHome: () => void;
}

export const ChatToolbar: FC<ChatToolbarProps> = ({ onGoHome }) => {
	const navigate = useNavigate();
	const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

	return (
		<>
			<aside className="hidden xl:flex h-full w-14 border-r border-border bg-card p-1 flex-col">
				<div className="space-y-2">
					<Button
						title="Nueva conversación"
						variant="ghost"
						className="w-full"
						onClick={() => setIsNewChatModalOpen(true)}
					>
						<Plus className="h-4 w-4" />
					</Button>
					<Button
						title="Inicio chat interno"
						variant="ghost"
						className="w-full"
						onClick={onGoHome}
					>
						<Home className="h-4 w-4" />
					</Button>
					<Button
						title="Ir a chat con agentes"
						variant="ghost"
						className="w-full"
						onClick={() => navigate("/chat/agents")}
					>
						<MessageSquare className="h-4 w-4" />
					</Button>
				</div>
			</aside>

			<NewChatModal
				open={isNewChatModalOpen}
				onOpenChange={setIsNewChatModalOpen}
				onSelectContact={() => {}}
			/>
		</>
	);
};
