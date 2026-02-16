import {
	GripHorizontal,
	MessageSquare,
	Minus,
	PanelRightClose,
	PanelRightOpen,
} from "lucide-react";
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatConversation } from "@/chat/components/chat-conversation";
import { useChatContext } from "@/chat/hooks/useChatContext";
import api from "@/lib/api";
import { useProjectContext } from "./ProjectProvider";

interface ProjectChatPanelProps {
	isOpen: boolean;
	onToggle: () => void;
}

interface PanelPosition {
	x: number;
	y: number;
}

export default function ProjectChatPanel({
	isOpen,
	onToggle,
}: ProjectChatPanelProps) {
	const { project, refreshProject, isLoading } = useProjectContext();
	const { conversations, loadingConversations, fetchConversations } =
		useChatContext();
	const panelRef = useRef<HTMLElement | null>(null);
	const draggingRef = useRef(false);
	const dragOffsetRef = useRef({ x: 0, y: 0 });

	const [showSettings, setShowSettings] = useState(false);
	const [isCreatingConversation, setIsCreatingConversation] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [position, setPosition] = useState<PanelPosition | null>(null);

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

	useEffect(() => {
		if (!isOpen || position !== null) return;
		const panel = panelRef.current;
		const container = panel?.parentElement;
		if (!container) return;

		const panelWidth = 390;
		const panelHeight = 640;
		const margin = 16;

		setPosition({
			x: Math.max(margin, container.clientWidth - panelWidth - margin),
			y: Math.max(margin, container.clientHeight - panelHeight - margin),
		});
	}, [isOpen, position]);

	useEffect(() => {
		if (!isOpen) {
			setIsMinimized(false);
		}
	}, [isOpen]);

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			if (!draggingRef.current) return;

			const panel = panelRef.current;
			const container = panel?.parentElement;
			if (!panel || !container) return;

			const panelRect = panel.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			const margin = 8;

			const minX = margin;
			const minY = margin;
			const maxX = Math.max(margin, containerRect.width - panelRect.width - margin);
			const maxY = Math.max(margin, containerRect.height - panelRect.height - margin);

			setPosition({
				x: Math.min(
					maxX,
					Math.max(minX, event.clientX - containerRect.left - dragOffsetRef.current.x),
				),
				y: Math.min(
					maxY,
					Math.max(minY, event.clientY - containerRect.top - dragOffsetRef.current.y),
				),
			});
		};

		const handleMouseUp = () => {
			draggingRef.current = false;
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	const handleDragStart = (event: ReactMouseEvent<HTMLDivElement>) => {
		const panel = panelRef.current;
		if (!panel) return;
		const panelRect = panel.getBoundingClientRect();
		draggingRef.current = true;
		dragOffsetRef.current = {
			x: event.clientX - panelRect.left,
			y: event.clientY - panelRect.top,
		};
	};

	if (!isOpen) {
		return null;
	}

	return (
		<aside
			ref={panelRef}
			style={{
				left: position?.x ?? 16,
				top: position?.y ?? 16,
			}}
			className="hidden lg:flex absolute z-40 w-[390px] max-w-[calc(100%-1rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex-col overflow-hidden"
		>
			<div
				className="h-12 px-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing"
				onMouseDown={handleDragStart}
			>
				<div className="flex items-center gap-2 min-w-0">
					<div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
						<MessageSquare className="w-4 h-4" />
					</div>
					<div className="min-w-0">
						<p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
							Chat del proyecto
						</p>
						<p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
							{project?.name || "Proyecto"}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-1">
					<GripHorizontal className="w-4 h-4 text-gray-400" />
					<Button
						variant="ghost"
						size="icon"
						onMouseDown={(event) => event.stopPropagation()}
						onClick={() => setIsMinimized((prev) => !prev)}
						title={isMinimized ? "Expandir chat" : "Minimizar chat"}
					>
						{isMinimized ? (
							<PanelRightOpen className="w-4 h-4" />
						) : (
							<Minus className="w-4 h-4" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onMouseDown={(event) => event.stopPropagation()}
						onClick={onToggle}
						title="Cerrar chat del proyecto"
					>
						<PanelRightClose className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{!isMinimized && (
				<div className="h-[calc(100vh-11rem)] max-h-[640px] min-h-[380px]">
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
			)}
		</aside>
	);
}
