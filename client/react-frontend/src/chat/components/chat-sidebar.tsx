import { type FC, useState } from "react";
import { Home, Search, Users } from "lucide-react";
import { IoChatboxOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEmojiFromName } from "@/utils/util";
import type { Conversation } from "../hooks/useChat";
import { useChatContext } from "../hooks/useChatContext";

interface ChatSidebarProps {
	selectedChat?: Conversation;
	onSelectChat: (chat: Conversation) => void;
}

export function ChatSidebar({ selectedChat, onSelectChat }: ChatSidebarProps) {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState<"all" | "private">("all");
	const { conversations } = useChatContext();

	const filteredChats = conversations.filter((chat) => {
		const chatName = chat.title || chat.members?.[0]?.name || "";
		if (!chatName) return false;
		const matchesSearch = chatName
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesFilter = filter === "all" || chat.type === filter;
		return matchesSearch && matchesFilter && chat.type !== "bot";
	});

	return (
		<div className="h-full flex flex-col bg-sidebar min-w-0">
			<div className="p-4 border-b border-sidebar-border space-y-3">
				<div className="flex items-center justify-between">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate("/dashboard")}
						className="text-blue-600 dark:text-blue-400"
					>
						<Home className="w-4 h-4 mr-1" /> Inicio
					</Button>
					<div className="flex gap-2 items-center">
						<IoChatboxOutline className="size-4" />
						<h1 className="text-lg font-bold text-sidebar-foreground">SYSGD-CHAT</h1>
					</div>
				</div>

				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar conversaciones..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
					/>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<Button
						variant={filter === "all" ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter("all")}
					>
						Todos
					</Button>
					<Button
						variant={filter === "private" ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter("private")}
					>
						<Users className="h-4 w-4 mr-1" /> Directos
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-2">
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
	);
}

const ChatConversationItem: FC<{
	chat: Conversation;
	onSelectChat: (chat: Conversation) => void;
	isSelected: boolean;
}> = ({ chat, onSelectChat, isSelected }) => (
	<button
		type="button"
		onClick={() => onSelectChat(chat)}
		className={`w-full p-3 rounded-lg mb-1 text-left transition-colors ${
			isSelected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
		}`}
	>
		<div className="flex items-start gap-3">
			<div className="w-10 h-10 rounded-full bg-sidebar-primary/10 flex items-center justify-center text-sm">
				{getEmojiFromName(chat.title || chat.members?.[0]?.name || "Usuario")}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex justify-between gap-2 mb-1">
					<h3 className="font-semibold text-sm truncate">{chat.title ?? chat.members?.[0]?.name}</h3>
					<span className="text-xs whitespace-nowrap">
						{chat.last_message?.created_at
							? new Date(chat.last_message.created_at).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})
							: ""}
					</span>
				</div>
				<p className="text-sm truncate text-muted-foreground">
					{chat.last_message?.content || "Sin mensajes aún"}
				</p>
			</div>
		</div>
	</button>
);
