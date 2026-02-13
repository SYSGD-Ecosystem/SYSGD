"use client";

import { Bot, Menu, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getRandomEmoji } from "@/utils/util";
import type { Agent } from "../../types/Agent";
import type { Conversation } from "../hooks/useChat";
import { useChatContext } from "../hooks/useChatContext";
import { AgentsChatConversation } from "./agents-chat-conversation";
import { AgentsListModal } from "./agents-list-modal";
import { ChatToolbar } from "./chat-toolbar";
import { ThemeToggle } from "./theme-toggle";

export function AgentsChatInterface() {
	const [selectedChat, setSelectedChat] = useState<Conversation | undefined>();
	const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [showSettings, setShowSettings] = useState(false);
	const [showAgentsList, setShowAgentsList] = useState(false);
	const { conversations } = useChatContext();

	const agentConversations = useMemo(
		() => conversations.filter((conversation) => conversation.type === "bot"),
		[conversations],
	);

	return (
		<div className="flex h-screen bg-background">
			<div
				className={`${sidebarOpen ? "w-80" : "w-0"} transition-[width] duration-300 border-r border-border overflow-hidden min-w-0 shrink-0`}
			>
				<div className="h-full flex flex-col bg-sidebar">
					<div className="p-4 border-b border-sidebar-border space-y-3">
						<div className="flex items-center justify-between">
							<h2 className="font-semibold text-sidebar-foreground">Chat con agentes</h2>
							<Button size="sm" onClick={() => setShowAgentsList(true)}>
								Seleccionar agente
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Conversaciones dedicadas a agentes externos.
						</p>
					</div>
					<div className="flex-1 overflow-y-auto p-2">
						{agentConversations.map((chat) => (
							<button
								key={chat.id}
								type="button"
								onClick={() => setSelectedChat(chat)}
								className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
									selectedChat?.id === chat.id
										? "bg-sidebar-accent"
										: "hover:bg-sidebar-accent/60"
								}`}
							>
								<div className="font-medium truncate">{chat.title || "Agente"}</div>
								<div className="text-xs text-muted-foreground truncate">
									{chat.last_message?.content || "Sin mensajes"}
								</div>
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="flex-1 flex flex-col">
				<div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setSidebarOpen((prev) => !prev)}
						>
							<Menu className="h-5 w-5" />
						</Button>
						{selectedChat && (
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
									{getRandomEmoji()}
								</div>
								<div>
									<h2 className="font-semibold text-lg text-foreground">
										{selectedChat.title || "Conversación con agente"}
									</h2>
									<p className="text-xs text-muted-foreground flex items-center gap-1">
										<Bot className="h-3 w-3" />
										{selectedAgent?.name || "Sin agente seleccionado"}
									</p>
								</div>
							</div>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={() => setShowAgentsList(true)}>
							Cambiar agente
						</Button>
						{selectedChat && (
							<Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
								<Settings className="h-5 w-5" />
							</Button>
						)}
						<ThemeToggle />
					</div>
				</div>

				<div className="flex-1 overflow-hidden">
					{selectedChat ? (
						<AgentsChatConversation
							chat={selectedChat}
							showSettings={showSettings}
							onShowSettingsChange={setShowSettings}
							selectedAgent={selectedAgent}
						/>
					) : (
						<div className="h-full flex items-center justify-center text-muted-foreground">
							Selecciona una conversación de agente para comenzar.
						</div>
					)}
				</div>
			</div>

			<ChatToolbar selectedChat={selectedChat} onGoHome={() => setSelectedChat(undefined)} />

			<AgentsListModal
				open={showAgentsList}
				onOpenChange={setShowAgentsList}
				onAgentSelect={(agent) => setSelectedAgent(agent)}
			/>
		</div>
	);
}
