"use client";

import { FC, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { Badge } from "@/components/ui/badge";
import { Search, Users, Bot, Plus } from "lucide-react";
// import type { Chat } from "./chat-interface"
import { NewChatModal } from "./new-chat-modal";
// // import type { ChatSidebarProps } from "./chat-sidebar-props" // Declare the variable here

import { Conversation, useChat } from "../hooks/useChat";
import { getRandomEmoji } from "@/utils/util";

interface ChatSidebarProps {
	selectedChat?: Conversation;
	onSelectChat: (chat: Conversation) => void;
}

// Mock data
// const mockChats: Chat[] = [
//   {
//     id: "1",
//     name: "María González",
//     type: "user",
//     lastMessage: "Perfecto, nos vemos mañana",
//     timestamp: "10:30",
//     unread: 2,
//     avatar: "MG",
//     online: true,
//   },
//   {
//     id: "2",
//     name: "Agente Soporte Técnico",
//     type: "agent",
//     lastMessage: "¿En qué puedo ayudarte hoy?",
//     timestamp: "09:15",
//     avatar: "🤖",
//     online: true,
//   },
//   {
//     id: "3",
//     name: "Carlos Ramírez",
//     type: "user",
//     lastMessage: "Gracias por la información",
//     timestamp: "Ayer",
//     avatar: "CR",
//     online: false,
//   },
//   {
//     id: "4",
//     name: "Agente Ventas",
//     type: "agent",
//     lastMessage: "Tenemos una oferta especial para ti",
//     timestamp: "Ayer",
//     unread: 1,
//     avatar: "💼",
//     online: true,
//   },
//   {
//     id: "5",
//     name: "Ana Martínez",
//     type: "user",
//     lastMessage: "Claro, sin problema",
//     timestamp: "15/10",
//     avatar: "AM",
//     online: false,
//   },
// ]

export function ChatSidebar({ selectedChat, onSelectChat }: ChatSidebarProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState<"all" | "user" | "agent">("all");
	const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

	const { conversations, fetchConversations } = useChat(); // Reemplaza 0 con el ID real del usuario;

	console.log("Conversations in Sidebar:", conversations);

	const filteredChats = conversations.filter((chat) => {
		if (!chat.members || chat.members.length === 0 || !chat.members[0].name)
			return false;

		const matchesSearch = chat.members?.[0].name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesFilter = filter === "all" || chat.type === filter;
		return matchesSearch && matchesFilter;
	});

	const handleNewChat = (contact: Conversation) => {
		fetchConversations();
		onSelectChat(contact);
	};

	return (
		<div className="h-full flex flex-col bg-sidebar">
			{/* Header */}
			<div className="p-4 border-b border-sidebar-border">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-xl font-bold text-sidebar-foreground">
						SYSGD-CHAT
					</h1>
					<Button
						size="icon"
						variant="default"
						onClick={() => setIsNewChatModalOpen(true)}
						title="Nueva conversación"
					>
						<Plus className="h-5 w-5" />
					</Button>
				</div>

				{/* Search */}
				<div className="relative mb-3">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar conversaciones..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
					/>
				</div>

				{/* Filters */}
				<div className="flex gap-2">
					<Button
						variant={filter === "all" ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter("all")}
						className="flex-1"
					>
						Todos
					</Button>
					<Button
						variant={filter === "user" ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter("user")}
						className="flex-1"
					>
						<Users className="h-4 w-4 mr-1" />
						Usuarios
					</Button>
					<Button
						variant={filter === "agent" ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter("agent")}
						className="flex-1"
					>
						<Bot className="h-4 w-4 mr-1" />
						Agentes
					</Button>
				</div>
			</div>

			{/* Chat List */}
			<ScrollArea className="flex-1 overflow-y-auto">
				<div className="p-2 w-full">
					{filteredChats.map((chat) => (
						<ChatConversationItem
							key={chat.id}
							chat={chat}
							onSelectChat={onSelectChat}
							isSelected={selectedChat?.id === chat.id}
						/>
					))}
				</div>
			</ScrollArea>

			<NewChatModal
				open={isNewChatModalOpen}
				onOpenChange={setIsNewChatModalOpen}
				onSelectContact={handleNewChat}
			/>
		</div>
	);
}

const ChatConversationItem: FC<{
	chat: Conversation;
	onSelectChat: (chat: Conversation) => void;
	isSelected: boolean;
}> = ({ chat, onSelectChat, isSelected }) => {
	return (
		<button
			type="button"
			key={chat.id}
			onClick={() => onSelectChat(chat)}
			className={`w-full p-3 rounded-lg mb-1 text-left transition-colors ${
				isSelected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
			}`}
		>
			<div className="flex items-start gap-3">
				<div className="relative flex-shrink-0">
					<div className="w-12 h-12 rounded-full bg-sidebar-primary/10 flex items-center justify-center text-sidebar-primary font-semibold">
						{getRandomEmoji()}
					</div>
					{/* {chat.online && (
						<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar" />
					)} */}
				</div>
				<div className="flex-1 min-w-0 flex flex-col">
					<div className="flex items-baseline justify-between gap-2 mb-1 min-w-0">
						<h3 className="font-semibold text-sm text-sidebar-foreground truncate flex-1">
							{chat.members && chat.members.length > 1
								? chat.members[1].name
								: chat.members && chat.members[0].name}
						</h3>
						<span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
							{chat.last_message && chat.last_message.created_at
								? new Date(chat.last_message.created_at).toLocaleTimeString(
										[],
										{
											hour: "2-digit",
											minute: "2-digit",
										},
									)
								: ""}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<p className="text-sm text-muted-foreground truncate flex-1">
							{chat.last_message?.content || "Sin mensajes aún"}
						</p>
						{/* {chat.unread && (
							<Badge
								variant="default"
								className="flex-shrink-0 h-5 min-w-5 px-1.5"
							>
								{chat.unread}
							</Badge>
						)} */}
					</div>
				</div>
			</div>
		</button>
	);
};
