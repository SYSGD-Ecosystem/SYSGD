"use client";

import { Menu, MessageSquare, Settings, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getRandomEmoji } from "@/utils/util";
import type { Conversation } from "../hooks/useChat";
import { ChatConversation } from "./chat-conversation";
import { ChatSidebar } from "./chat-sidebar";
import { ChatToolbar } from "./chat-toolbar";
import { ThemeToggle } from "./theme-toggle";

export type ChatType = "user" | "agent";

export interface Chat {
	id: string;
	name: string;
	type: ChatType;
	lastMessage: string;
	timestamp: string;
	unread?: number;
	avatar?: string;
	online?: boolean;
}

export interface Message {
	id: string;
	content: string;
	sender: "me" | "other";
	timestamp: string;
	senderName?: string;
	avatar?: string;
}

export function ChatInterface() {
	const navigate = useNavigate();
	const [selectedChat, setSelectedChat] = useState<Conversation | undefined>();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showMembersModal, setShowMembersModal] = useState(false);

	const headerTitle = useMemo(() => {
		if (!selectedChat) return "Chat interno";
		return (
			selectedChat.title ||
			(selectedChat.members && selectedChat.members.length === 2
				? selectedChat.members[1].name
				: "Conversación")
		);
	}, [selectedChat]);

	const members = useMemo(() => {
		if (!selectedChat?.members) return [];
		return selectedChat.members;
	}, [selectedChat]);

	return (
		<div className="flex h-screen bg-background overflow-hidden">
			{sidebarOpen && (
				<button
					type="button"
					className="fixed inset-0 bg-black/40 z-20 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			<aside
				className={`fixed lg:static inset-y-0 left-0 z-30 w-80 max-w-[85vw] transform border-r border-border bg-sidebar transition-transform duration-200 ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
				}`}
			>
				<ChatSidebar
					selectedChat={selectedChat}
					onSelectChat={(chat) => {
						setSelectedChat(chat);
						setSidebarOpen(false);
					}}
				/>
			</aside>

			<main className="flex-1 flex flex-col min-w-0">
				<header className="h-14 border-b border-border flex items-center justify-between px-3 sm:px-4 bg-card">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0">
						<Button variant="ghost" size="icon" onClick={() => setSidebarOpen((v) => !v)}>
							{sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</Button>
						<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0 text-sm">
							{selectedChat ? getRandomEmoji() : "💬"}
						</div>
						<div className="min-w-0">
							<button
								type="button"
								onClick={() => selectedChat && setShowMembersModal(true)}
								disabled={!selectedChat}
								className={`text-left hover:text-primary transition-colors ${
									selectedChat ? "cursor-pointer" : "cursor-default"
								}`}
							>
								<h2 className="text-sm sm:text-base font-medium text-foreground truncate">
									{headerTitle}
								</h2>
							</button>
							<p className="text-xs text-muted-foreground truncate">
								{members.length > 0
									? `${members.length} miembro${members.length !== 1 ? "s" : ""}`
									: "Canal de colaboración interna"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-1 sm:gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate("/chat/agents")}
							title="Ir al chat con agentes"
						>
							<MessageSquare className="h-5 w-5" />
						</Button>
						{selectedChat && (
							<Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
								<Settings className="h-5 w-5" />
							</Button>
						)}
						<ThemeToggle />
					</div>
				</header>

				<div className="flex-1 overflow-hidden">
					{selectedChat ? (
						<ChatConversation
							chat={selectedChat}
							showSettings={showSettings}
							onShowSettingsChange={setShowSettings}
						/>
					) : (
						<div className="h-full flex items-center justify-center text-muted-foreground p-6 text-center">
							<div>
								<h3 className="text-base font-semibold mb-2 text-foreground">Bienvenido a SYSGD-CHAT</h3>
								<p className="text-sm">Selecciona una conversación para comenzar.</p>
							</div>
						</div>
					)}
				</div>
			</main>

			<ChatToolbar selectedChat={selectedChat} onGoHome={() => setSelectedChat(undefined)} />

			<Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Miembros de la conversación
						</DialogTitle>
					</DialogHeader>
					<ScrollArea className="max-h-[400px] mt-4">
						<div className="space-y-2">
							{members.map((member) => (
								<div
									key={member.id}
									className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
								>
									<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
										{member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || "?"}
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium truncate">{member.name || member.email}</p>
										<p className="text-xs text-muted-foreground truncate">{member.email}</p>
									</div>
									{member.role === "admin" && (
										<span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
											Admin
										</span>
									)}
								</div>
							))}
							{members.length === 0 && (
								<p className="text-center text-muted-foreground py-4">
									No hay miembros en esta conversación
								</p>
							)}
						</div>
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</div>
	);
}
