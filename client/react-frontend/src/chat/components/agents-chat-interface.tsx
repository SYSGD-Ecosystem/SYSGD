"use client";

import { Bot, Menu, Plus, Settings, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRandomEmoji } from "@/utils/util";
import useCurrentUser from "@/hooks/connection/useCurrentUser";
import type { Agent } from "../../types/Agent";
import type { Conversation } from "../hooks/useChat";
import { useChatContext } from "../hooks/useChatContext";
import { AgentsChatConversation } from "./agents-chat-conversation";
import { AgentsListModal } from "./agents-list-modal";
import { CreateAgentModal } from "./create-agent-modal";
import { ThemeToggle } from "./theme-toggle";

export function AgentsChatInterface() {
	const navigate = useNavigate();
	const [selectedChat, setSelectedChat] = useState<Conversation | undefined>();
	const [conversationAgents, setConversationAgents] = useState<
		Record<string, Agent>
	>({});
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showAgentsList, setShowAgentsList] = useState(false);
	const [showCreateAgent, setShowCreateAgent] = useState(false);
	const [newConversationName, setNewConversationName] = useState("");
	const { conversations, createConversation, fetchConversations } = useChatContext();
	const { user } = useCurrentUser();

	const agentConversations = useMemo(
		() => conversations.filter((conversation) => conversation.type === "bot"),
		[conversations],
	);

	const selectedAgent = selectedChat ? conversationAgents[selectedChat.id] ?? null : null;

	const handleCreateAgentConversation = async () => {
		if (!user?.email) return;
		const title = newConversationName.trim();
		if (!title) return;

		const conversation = await createConversation({
			type: "bot",
			title,
			members: [user.email],
		});

		if (conversation) {
			setSelectedChat(conversation);
			setNewConversationName("");
			await fetchConversations();
		}
	};

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
				<div className="h-full flex flex-col">
					<div className="p-3 border-b border-sidebar-border space-y-2.5">
						<div className="flex items-center justify-between">
							<h2 className="text-sm font-semibold text-sidebar-foreground">Chat con agentes</h2>
							<Button size="icon" variant="outline" onClick={() => setShowCreateAgent(true)} title="Crear agente">
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">Sección dedicada a conversaciones con agentes externos.</p>
						<div className="space-y-2">
							<Input
								placeholder="Nombre de la conversación"
								value={newConversationName}
								onChange={(e) => setNewConversationName(e.target.value)}
							/>
							<Button className="w-full" onClick={() => void handleCreateAgentConversation()}>
								Nueva conversación
							</Button>
							{selectedChat && (
								<Button variant="secondary" className="w-full" onClick={() => setShowAgentsList(true)}>
									Seleccionar agente para esta conversación
								</Button>
							)}
						</div>
					</div>
					<div className="flex-1 overflow-y-auto p-2">
						{agentConversations.map((chat) => (
							<button
								key={chat.id}
								type="button"
								onClick={() => {
									setSelectedChat(chat);
									setSidebarOpen(false);
								}}
								className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
									selectedChat?.id === chat.id
										? "bg-sidebar-accent"
										: "hover:bg-sidebar-accent/60"
								}`}
							>
								<div className="font-medium truncate">{chat.title || "Agente"}</div>
								<div className="text-xs text-muted-foreground truncate">{chat.last_message?.content || "Sin mensajes"}</div>
							</button>
						))}
					</div>
				</div>
			</aside>

			<main className="flex-1 flex flex-col min-w-0">
				<header className="h-14 border-b border-border flex items-center justify-between px-3 sm:px-4 bg-card">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0">
						<Button variant="ghost" size="icon" onClick={() => setSidebarOpen((v) => !v)}>
							{sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</Button>
						<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
							{selectedChat ? getRandomEmoji() : <Bot className="h-4 w-4" />}
						</div>
						<div className="min-w-0">
							<h2 className="text-sm sm:text-base font-medium text-foreground truncate">
								{selectedChat?.title || "Módulo de agentes"}
							</h2>
							<p className="text-xs text-muted-foreground truncate">{selectedAgent?.name || "Sin agente seleccionado"}</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{selectedChat && (
							<Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
								<Settings className="h-5 w-5" />
							</Button>
						)}
						<ThemeToggle />
						<Button variant="ghost" size="sm" onClick={() => navigate("/chat")}>
							Chat interno
						</Button>
					</div>
				</header>

				<div className="flex-1 overflow-hidden">
					{selectedChat ? (
						<AgentsChatConversation
							chat={selectedChat}
							showSettings={showSettings}
							onShowSettingsChange={setShowSettings}
							selectedAgent={selectedAgent}
						/>
					) : (
						<div className="h-full flex items-center justify-center text-muted-foreground p-6 text-center">
							<div>
								<h3 className="text-base font-semibold text-foreground mb-2">Selecciona una conversación de agente</h3>
								<p className="text-sm">Puedes crear un agente nuevo o seleccionar uno existente para iniciar.</p>
							</div>
						</div>
					)}
				</div>
			</main>

			<AgentsListModal
				open={showAgentsList}
				onOpenChange={setShowAgentsList}
				onAgentSelect={(agent) => {
					if (!selectedChat) return;
					setConversationAgents((prev) => ({
						...prev,
						[selectedChat.id]: agent,
					}));
				}}
			/>
			<CreateAgentModal
				open={showCreateAgent}
				onOpenChange={setShowCreateAgent}
				onAgentCreated={(agent) => {
					if (selectedChat) {
						setConversationAgents((prev) => ({
							...prev,
							[selectedChat.id]: agent,
						}));
					}
					setShowCreateAgent(false);
				}}
			/>
		</div>
	);
}
