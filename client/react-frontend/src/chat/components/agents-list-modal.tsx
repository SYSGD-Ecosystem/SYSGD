"use client";

import { Bot, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { type FC, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { Agent, AgentSupport } from "../../types/Agent";
import { useAgents } from "../hooks/useAgents";

interface AgentsListModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAgentSelect?: (agent: Agent) => void;
}

export const AgentsListModal: FC<AgentsListModalProps> = ({
	open,
	onOpenChange,
	onAgentSelect,
}) => {
	const { agents, loading, deleteAgent, updateAgent } = useAgents();
	const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const getSupportBadgeColor = (support: AgentSupport) => {
		switch (support) {
			case "text":
				return "bg-blue-100 text-blue-800";
			case "image":
				return "bg-green-100 text-green-800";
			case "audio":
				return "bg-purple-100 text-purple-800";
			case "video":
				return "bg-orange-100 text-orange-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getSupportIcon = (support: AgentSupport) => {
		switch (support) {
			case "text":
				return "📝";
			case "image":
				return "🖼️";
			case "audio":
				return "🎵";
			case "video":
				return "🎥";
			default:
				return "❓";
		}
	};

	const handleDeleteAgent = async (agentId: string) => {
		setIsDeleting(true);
		const success = await deleteAgent(agentId);
		if (success) {
			setDeleteAgentId(null);
		}
		setIsDeleting(false);
	};

	const handleToggleAgent = async (agent: Agent) => {
		await updateAgent(agent.id, { is_active: !agent.is_active });
	};

	const handleAgentSelect = (agent: Agent) => {
		onAgentSelect?.(agent);
		onOpenChange(false);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Seleccionar agente</DialogTitle>
						<DialogDescription>
							Elige qué agente quieres usar en la conversación actual.
						</DialogDescription>
					</DialogHeader>

					{loading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin" />
							<span className="ml-2">Cargando agentes...</span>
						</div>
					) : agents.length === 0 ? (
						<div className="text-center py-8">
							<Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">No hay agentes</h3>
							<p className="text-muted-foreground">
								Crea tu primer agente para comenzar a usar el sistema.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{agents.map((agent) => (
								<div key={agent.id} className="border rounded-lg p-4 space-y-3 bg-card">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<Bot className="h-4 w-4 text-primary" />
												<h4 className="font-semibold truncate">{agent.name}</h4>
											</div>
											{agent.description && (
												<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
													{agent.description}
												</p>
											)}
										</div>
										<Badge variant={agent.is_active ? "default" : "secondary"}>
											{agent.is_active ? "Activo" : "Inactivo"}
										</Badge>
									</div>

									<p className="text-xs text-muted-foreground truncate">{agent.url}</p>

									<div className="flex flex-wrap gap-1">
										{agent.support.map((support) => (
											<Badge key={support} variant="secondary" className={`text-xs ${getSupportBadgeColor(support)}`}>
												{getSupportIcon(support)} {support}
											</Badge>
										))}
									</div>

									<div className="flex items-center gap-2 pt-1">
										<Button size="sm" onClick={() => handleAgentSelect(agent)}>
											Usar en conversación
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleToggleAgent(agent)}
										>
											{agent.is_active ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
											{agent.is_active ? "Desactivar" : "Activar"}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setDeleteAgentId(agent.id)}
											className="text-red-600 hover:text-red-700"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar agente?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. El agente será eliminado permanentemente.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteAgentId && handleDeleteAgent(deleteAgentId)}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700"
						>
							{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
