import {
	ChevronLeft,
	ChevronRight,
	HelpCircle,
	Home,
	MessageSquare,
	Settings,
} from "lucide-react";
import { type FC, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Conversation } from "../hooks/useChat";
import { NewChatModal } from "./new-chat-modal";
import { useNavigate } from "react-router-dom";

interface ChatToolbarProps {
	selectedChat?: Conversation;
	onGoHome: () => void;
}

export const ChatToolbar: FC<ChatToolbarProps> = ({
	selectedChat,
	onGoHome,
}) => {
	const navigate = useNavigate();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

	const toolbarItems = [
		{
			id: "home",
			icon: Home,
			label: "Inicio",
			onClick: onGoHome,
			variant: "ghost" as const,
		},
		{
			id: "agents-module",
			icon: MessageSquare,
			label: "Chat con Agentes",
			onClick: () => navigate("/chat/agents"),
			variant: "outline" as const,
		},
		{
			id: "settings",
			icon: Settings,
			label: "Configuración",
			onClick: () => console.log("Settings clicked"),
			variant: "ghost" as const,
		},
		{
			id: "help",
			icon: HelpCircle,
			label: "Ayuda",
			onClick: () => console.log("Help clicked"),
			variant: "ghost" as const,
		},
	];

	return (
		<>
			<div
				className={`h-full bg-card border-l justify-center border-border overflow-hidden transition-all duration-300 ${
					isCollapsed ? "w-16" : "w-64"
				}`}
			>
				{/* Header */}
				<div className="p-4 border-b border-border">
					<div className="flex items-center justify-between">
						{!isCollapsed && (
							<h3 className="font-semibold text-foreground text-lg">
								Herramientas
							</h3>
						)}
						<div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsCollapsed(!isCollapsed)}
								className="h-8 w-8"
							>
								{isCollapsed ? (
									<ChevronLeft className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
				</div>

				{/* Toolbar Items */}
				<div className="p-2 space-y-1">
					{toolbarItems.map((item) => {
						const Icon = item.icon;
						return (
							<Button
								key={item.id}
								variant={item.variant}
								size={isCollapsed ? "icon" : "sm"}
								onClick={item.onClick}
								className={`w-full  ${
									isCollapsed ? "justify-center h-10 w-10" : "justify-start h-10"
								}`}
								title={isCollapsed ? item.label : undefined}
							>
								<Icon className="h-4 w-4" />
								{!isCollapsed && (
									<span className="ml-2 text-sm">{item.label}</span>
								)}
							</Button>
						);
					})}
				</div>

				{/* Selected Chat Info */}
				{selectedChat && !isCollapsed && (
					<div className="p-4 border-t border-border">
						<div className="text-xs text-muted-foreground mb-2">
							Conversación actual:
						</div>
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
								{selectedChat.title?.charAt(0) || "?"}
							</div>
							<div className="flex-1 min-w-0">
								<div className="text-sm font-medium text-foreground truncate">
									{selectedChat.title || "Sin nombre"}
								</div>
								<div className="text-xs text-muted-foreground">
									Chat interno de equipo
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Quick Actions */}
				{!isCollapsed && (
					<div className="p-4 border-t border-border">
						<div className="text-xs text-muted-foreground mb-2">
							Acciones rápidas:
						</div>
						<div className="space-y-1">
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start h-8"
								onClick={() => setIsNewChatModalOpen(true)}
							>
								<MessageSquare className="h-3 w-3 mr-2" />
								<span className="text-xs">Nueva conversación</span>
							</Button>
						</div>
					</div>
				)}
			</div>

			<NewChatModal
				open={isNewChatModalOpen}
				onOpenChange={setIsNewChatModalOpen}
				onSelectContact={(c) => {
					console.log(c);
				}}
			/>
		</>
	);
};
