import { type FC, useState, useEffect, useRef } from "react";
import { Home, Search, Users, LogOut, Plus, MessageSquare, X } from "lucide-react";
import { IoChatboxOutline, IoChatbubbleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmojiFromName } from "@/utils/util";
import type { Conversation } from "../hooks/useChat";
import { useChatContext } from "../hooks/useChatContext";
import { useSocketContext } from "../hooks/useSocket";
import { NewChatModal } from "./new-chat-modal";
import api from "@/lib/api";
import type { User } from "@/types/user";

interface ChatSidebarProps {
	selectedChat?: Conversation;
	onSelectChat: (chat: Conversation) => void;
}

export function ChatSidebar({ selectedChat, onSelectChat }: ChatSidebarProps) {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState<"all" | "private">("all");
	const { conversations, loadingConversations } = useChatContext();
	const { isConnected: socketConnected } = useSocketContext();
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

	const getChatName = (chat: Conversation) => {
		if (chat.title?.trim()) return chat.title.trim();

		const otherMember = chat.members?.find((member) => member.id !== currentUser?.id);
		if (otherMember?.name?.trim()) return otherMember.name.trim();
		if (otherMember?.email?.trim()) return otherMember.email.trim();

		const firstMember = chat.members?.[0];
		if (firstMember?.name?.trim()) return firstMember.name.trim();
		if (firstMember?.email?.trim()) return firstMember.email.trim();

		return "Conversación";
	};

	const filteredChats = conversations.filter((chat) => {
		const chatName = getChatName(chat);
		const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFilter = filter === "all" || chat.type === filter;
		return matchesSearch && matchesFilter && chat.type !== "bot";
	});

	// Get current user info
	useEffect(() => {
		async function fetchUser() {
			try {
				const data = await api
					.get<User>("/api/auth/me")
					.then((res) => res.data)
					.catch(() => null);
				if (data) {
					setCurrentUser(data);
				}
			} catch (error) {
				console.error("Failed to fetch user data:", error);
			}
		}
		fetchUser();
	}, []);

	const handleLogout = () => {
		navigate("/dashboard");
	};

	return (
		<div className="h-full flex flex-col bg-sidebar min-w-0">
			<div className="border-b px-2 border-sidebar-border">
				<div className="flex h-14 items-center gap-2">
					<div className="size-8 flex items-center justify-center rounded-full p-0.5 text-white bg-blue-500">
						<IoChatboxOutline className="size-4" />
					</div>

					<div className="flex flex-col items-start leading-tight">
						<h1 className="text-lg flex items-center font-semibold text-sidebar-foreground">
							SYSGD CHAT
						</h1>
					</div>
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden">
				<aside className="hidden xl:flex h-full w-14 border-r border-border bg-card p-1 flex-col">
					<div className="space-y-2">
						<Button
							title="Todos"
							className="w-full"
							variant={filter === "all" ? "outline" : "ghost"}
							size="sm"
							onClick={() => setFilter("all")}
						>
							<IoChatbubbleOutline />
						</Button>
						<Button
							title="Directos"
							className="w-12"
							variant={filter === "private" ? "outline" : "ghost"}
							size="sm"
							onClick={() => setFilter("private")}
						>
							<Users className="h-4 w-4" />
						</Button>
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
							onClick={() => navigate("/chat")}
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

				<div className="flex flex-1 min-w-0 flex-col gap-2 px-2">
					<div className="relative group">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search className="h-4 w-4 text-muted-foreground/70 group-focus-within:text-sidebar-primary transition-colors" />
						</div>
						<Input
							placeholder="Buscar conversaciones..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 pr-10 bg-sidebar-accent/50 border-sidebar-border/50 text-sidebar-foreground placeholder:text-muted-foreground/50 rounded-xl h-10 focus:bg-sidebar-accent focus:border-sidebar-primary/50 focus:ring-2 focus:ring-sidebar-primary/20 transition-all duration-200"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-sidebar-accent text-muted-foreground/70 hover:text-sidebar-foreground transition-all opacity-0 group-focus-within:opacity-100"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						)}
					</div>

					<div className="flex-1 overflow-y-auto p-2">
						{loadingConversations && conversations.length === 0 ? (
							<div className="space-y-3 px-1">
								{Array.from({ length: 6 }).map((_, index) => (
									<div
										key={`chat-skeleton-${index}`}
										className="flex items-center gap-3 rounded-lg p-2"
									>
										<Skeleton className="h-10 w-10 rounded-full" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-3/4 rounded-md" />
											<Skeleton className="h-3 w-1/2 rounded-md" />
										</div>
									</div>
								))}
							</div>
						) : (
							<>
								{filteredChats.map((chat) => (
									<ChatConversationItem
										key={chat.id}
										chat={chat}
										chatName={getChatName(chat)}
										onSelectChat={onSelectChat}
										isSelected={selectedChat?.id === chat.id}
									/>
								))}
								{filteredChats.length === 0 && (
									<div className="px-2 py-6 text-center text-sm text-muted-foreground">
										No hay conversaciones para mostrar.
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			{/* Footer con barra móvil y perfil de usuario */}
			<div className="p-3 border-t border-sidebar-border bg-sidebar-accent/30 space-y-2">
				<div className="xl:hidden">
					<div className="grid grid-cols-5 gap-1 rounded-lg bg-sidebar-accent p-1">
						<Button
							title="Todos"
							variant={filter === "all" ? "outline" : "ghost"}
							size="sm"
							onClick={() => setFilter("all")}
							className="h-8 px-0"
						>
							<IoChatbubbleOutline className="h-4 w-4" />
						</Button>
						<Button
							title="Directos"
							variant={filter === "private" ? "outline" : "ghost"}
							size="sm"
							onClick={() => setFilter("private")}
							className="h-8 px-0"
						>
							<Users className="h-4 w-4" />
						</Button>
						<Button
							title="Nueva conversación"
							variant="ghost"
							className="h-8 px-0"
							onClick={() => setIsNewChatModalOpen(true)}
							size="sm"
						>
							<Plus className="h-4 w-4" />
						</Button>
						<Button
							title="Inicio chat interno"
							variant="ghost"
							className="h-8 px-0"
							onClick={() => navigate("/chat")}
							size="sm"
						>
							<Home className="h-4 w-4" />
						</Button>
						<Button
							title="Ir a chat con agentes"
							variant="ghost"
							className="h-8 px-0"
							onClick={() => navigate("/chat/agents")}
							size="sm"
						>
							<MessageSquare className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Perfil de usuario */}
				{currentUser && (
					<div className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors cursor-pointer">
						<div className="relative w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-semibold">
							{getEmojiFromName(currentUser.name)}
							<span
								className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-sidebar-accent ${
									socketConnected ? "bg-green-500" : "bg-red-500"
								}`}
								title={socketConnected ? "Conectado" : "Desconectado"}
							/>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate text-sidebar-foreground">
								{currentUser.name}
							</p>
							<p className="text-xs text-muted-foreground truncate">
								{currentUser.email}
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={handleLogout}
							title="Cerrar sesión"
						>
							<LogOut className="w-4 h-4" />
						</Button>
					</div>
				)}
			</div>
			<NewChatModal
				open={isNewChatModalOpen}
				onOpenChange={setIsNewChatModalOpen}
				onSelectContact={() => {}}
			/>
		</div>
	);
}

const ChatConversationItem: FC<{
	chat: Conversation;
	chatName: string;
	onSelectChat: (chat: Conversation) => void;
	isSelected: boolean;
}> = ({ chat, chatName, onSelectChat, isSelected }) => (
	<button
		type="button"
		onClick={() => onSelectChat(chat)}
		className={`w-full p-3 rounded-lg mb-1 text-left transition-colors ${
			isSelected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
		}`}
	>
		<div className="flex items-start gap-3">
			<div className="w-10 h-10 rounded-full bg-sidebar-primary/10 flex items-center justify-center text-sm">
				{getEmojiFromName(chatName)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex justify-between gap-2 mb-1">
					<h3 className="font-semibold text-sm truncate">{chatName}</h3>
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
