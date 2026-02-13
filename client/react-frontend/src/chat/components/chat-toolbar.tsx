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
			<aside className="hidden xl:flex h-full w-64 border-l border-border bg-card p-4 flex-col">
				<h3 className="font-semibold text-foreground mb-3">Acciones</h3>
				<div className="space-y-2">
					<Button
						variant="default"
						className="w-full justify-start"
						onClick={() => setIsNewChatModalOpen(true)}
					>
						<Plus className="h-4 w-4 mr-2" /> Nueva conversación
					</Button>
					<Button variant="outline" className="w-full justify-start" onClick={onGoHome}>
						<Home className="h-4 w-4 mr-2" /> Inicio chat interno
					</Button>
					<Button
						variant="outline"
						className="w-full justify-start"
						onClick={() => navigate("/chat/agents")}
					>
						<MessageSquare className="h-4 w-4 mr-2" /> Ir a chat con agentes
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
