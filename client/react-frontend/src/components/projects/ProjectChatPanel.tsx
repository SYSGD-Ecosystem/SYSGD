import { MessageSquare, PanelRightClose } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatConversation } from "@/chat/components/chat-conversation";
import { useChatContext } from "@/chat/hooks/useChatContext";
import api from "@/lib/api";
import { useProjectContext } from "./ProjectProvider";

interface ProjectChatPanelProps {
	isOpen: boolean;
	onToggle: () => void;
}

export default function ProjectChatPanel({
	isOpen,
	onToggle,
}: ProjectChatPanelProps) {
	const { project, refreshProject, isLoading } = useProjectContext();
	const { conversations, loadingConversations, fetchConversations } =
		useChatContext();
	const [showSettings, setShowSettings] = useState(false);
	const [isCreatingConversation, setIsCreatingConversation] = useState(false);

	const projectConversation = useMemo(() => {
		if (!project?.conversation_id) return null;
		return (
			conversations.find((conversation) => conversation.id === project.conversation_id) ??
			null
		);
	}, [conversations, project?.conversation_id]);

	const handleCreateProjectConversation = async () => {
		if (!project?.id || isCreatingConversation) return;
		setIsCreatingConversation(true);
		try {
			await api.post(`/api/projects/${project.id}/create-conversation`);
			await Promise.all([refreshProject(), fetchConversations()]);
		} catch (error) {
			console.error("No se pudo crear el chat del proyecto", error);
		} finally {
			setIsCreatingConversation(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<aside className="hidden lg:flex w-[360px] min-w-[320px] h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-col">
			<div className="h-14 px-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
				<div className="flex items-center gap-2 min-w-0">
					<div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
						<MessageSquare className="w-4 h-4" />
					</div>
					<div className="min-w-0">
						<p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
							Chat del proyecto
						</p>
						<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
							{project?.name || "Proyecto"}
						</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onToggle}
					title="Ocultar chat del proyecto"
				>
					<PanelRightClose className="w-4 h-4" />
				</Button>
			</div>

			<div className="flex-1 min-h-0">
				{isLoading || loadingConversations ? (
					<div className="h-full flex items-center justify-center px-4 text-sm text-gray-500 dark:text-gray-400">
						Cargando chat del proyecto...
					</div>
				) : !project?.conversation_id ? (
					<div className="h-full flex flex-col items-center justify-center px-6 text-center gap-3">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							Este proyecto aún no tiene un chat asociado.
						</p>
						<Button
							onClick={handleCreateProjectConversation}
							disabled={isCreatingConversation}
						>
							{isCreatingConversation
								? "Creando chat..."
								: "Crear chat del proyecto"}
						</Button>
					</div>
				) : !projectConversation ? (
					<div className="h-full flex items-center justify-center px-4 text-center text-sm text-gray-500 dark:text-gray-400">
						No se pudo cargar la conversación del proyecto.
					</div>
				) : (
					<ChatConversation
						chat={projectConversation}
						showSettings={showSettings}
						onShowSettingsChange={setShowSettings}
					/>
				)}
			</div>
		</aside>
	);
}
