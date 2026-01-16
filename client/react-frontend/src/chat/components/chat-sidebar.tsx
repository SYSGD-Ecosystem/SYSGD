// biome-ignore assist/source/organizeImports: <explanation>
import { type FC, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Bot, Home } from "lucide-react";
import { type Conversation, useChat } from "../hooks/useChat";
import { getEmojiFromName } from "@/utils/util";
import { useNavigate } from "react-router-dom";
import { IoChatboxOutline } from "react-icons/io5";
import { useAgents } from "../hooks/useAgents";
import type { Agent } from "../../types/Agent";


interface ChatSidebarProps {
	selectedChat?: Conversation;
	onSelectChat: (chat: Conversation) => void;
	onAgentSelect?: (agent: Agent) => void;
}

export function ChatSidebar({ selectedChat, onSelectChat }: ChatSidebarProps) {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState<
		"all" | "user" | "agent" | "private" | "bot"
	>("all");

	const { conversations } = useChat();
	const { agents } = useAgents();

	console.log(agents)

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

	return (
		<div className="h-full flex flex-col bg-sidebar min-w-0">
			{/* Header */}
			<div className="p-4 border-b border-sidebar-border">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								navigate("/dashboard");
							}}
							className={
								"flex items-center gap-2 text-blue-600 dark:text-blue-400"
							}
						>
							<Home className="w-4 h-4" />
							<span className="hidden sm:inline">Inicio</span>
						</Button>
					</div>
					<div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />
					<div className="flex gap-2 items-center w-full ml-4">
						<IoChatboxOutline className="size-4" />
						<h1 className="text-lg font-bold text-sidebar-foreground">
							SYSGD-CHAT
						</h1>
					</div>
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
						variant={filter === "private" ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter("private")}
						className="flex-1"
					>
						<Users className="h-4 w-4 mr-1" />
						Usuarios
					</Button>
					<Button
						variant={filter === "bot" ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter("bot")}
						className="flex-1"
					>
						<Bot className="h-4 w-4 mr-1" />
						Agentes
					</Button>
				</div>
			</div>

			{/* Chat List */}
			<div className="flex-1 overflow-y-auto min-w-0 overflow-x-hidden">
				<div className="p-2 w-full min-w-0">
					{filteredChats.map((chat) => (
						<ChatConversationItem
							key={chat.id}
							chat={chat}
							onSelectChat={onSelectChat}
							isSelected={selectedChat?.id === chat.id}
						/>
					))}
				</div>
			</div>
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
			onClick={() => onSelectChat(chat)}
			className={`
    w-full min-w-0 flex p-3 rounded-lg mb-1 text-left transition-colors
    ${isSelected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"}
  `}
		>
			<div className="flex items-start gap-3 w-full min-w-0">
				<div className="flex-shrink-0 min-w-0">
					<div className="w-12 h-12 rounded-full bg-sidebar-primary/10 flex items-center justify-center">
						{getEmojiFromName(
							chat.title || chat.members?.[0]?.name || "Usuario",
						)}
					</div>
				</div>

				<div className="flex-1 flex flex-col min-w-0">
					<div className="flex items-baseline justify-between gap-2 mb-1 min-w-0">
						<h3 className="font-semibold text-sm truncate flex-1 min-w-0">
							{chat.title ?? chat.members?.[0]?.name}
						</h3>
						<span className="text-xs whitespace-nowrap flex-shrink-0">
							{chat.last_message?.created_at
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

					<div className="flex items-center gap-2 min-w-0">
						<p className="text-sm truncate flex-1 min-w-0">
							{chat.last_message?.content || "Sin mensajes aún"}
						</p>
					</div>
				</div>
			</div>
		</button>
	);
};
