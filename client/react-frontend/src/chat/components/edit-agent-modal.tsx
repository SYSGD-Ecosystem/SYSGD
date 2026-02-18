"use client";

import { Loader2 } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Agent, AgentSupport, UpdateAgentRequest } from "../../types/Agent";
import { useAgents } from "../hooks/useAgents";

interface EditAgentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	agent: Agent | null;
	onAgentUpdated?: (agent: Agent) => void;
}

const SUPPORT_OPTIONS: AgentSupport[] = ["text", "image", "audio", "video"];

export const EditAgentModal: FC<EditAgentModalProps> = ({
	open,
	onOpenChange,
	agent,
	onAgentUpdated,
}) => {
	const { updateAgent, loading } = useAgents();
	const [formData, setFormData] = useState<UpdateAgentRequest>({
		name: "",
		url: "",
		support: ["text"],
		description: "",
		systemPrompt: "",
		is_active: true,
		is_public: false,
	});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!agent || !open) return;
		setFormData({
			name: agent.name,
			url: agent.url,
			support: agent.support,
			description: agent.description ?? "",
			systemPrompt: agent.system_prompt ?? "",
			is_active: agent.is_active,
			is_public: agent.is_public,
		});
		setError(null);
	}, [agent, open]);

	const handleSubmit = async () => {
		if (!agent) return;
		if (!formData.name?.trim()) {
			setError("El nombre del agente es obligatorio.");
			return;
		}
		if (!formData.url?.trim()) {
			setError("La URL del agente es obligatoria.");
			return;
		}
		if (!formData.support || formData.support.length === 0) {
			setError("Debes seleccionar al menos una capacidad.");
			return;
		}

		const updated = await updateAgent(agent.id, {
			name: formData.name.trim(),
			url: formData.url.trim(),
			support: formData.support,
			description: formData.description?.trim() || undefined,
			systemPrompt: formData.systemPrompt?.trim() || undefined,
			is_active: formData.is_active,
			is_public: formData.is_public,
		});

		if (updated) {
			onAgentUpdated?.(updated);
			onOpenChange(false);
			return;
		}

		setError("No se pudo actualizar el agente.");
	};

	const toggleSupport = (support: AgentSupport, checked: boolean) => {
		setFormData((prev) => ({
			...prev,
			support: checked
				? [...(prev.support ?? []), support]
				: (prev.support ?? []).filter((s) => s !== support),
		}));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[560px]">
				<DialogHeader>
					<DialogTitle>Editar agente</DialogTitle>
					<DialogDescription>
						Actualiza la configuración y visibilidad del agente.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="edit-agent-name">Nombre</Label>
						<Input
							id="edit-agent-name"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-agent-url">URL</Label>
						<Input
							id="edit-agent-url"
							value={formData.url}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, url: e.target.value }))
							}
						/>
					</div>

					<div className="space-y-2">
						<Label>Capacidades</Label>
						<div className="grid grid-cols-2 gap-2">
							{SUPPORT_OPTIONS.map((support) => (
								<label
									key={support}
									className="flex items-center gap-2 rounded border p-2 text-sm"
								>
									<Checkbox
										checked={(formData.support ?? []).includes(support)}
										onCheckedChange={(checked) =>
											toggleSupport(support, Boolean(checked))
										}
									/>
									<span className="capitalize">{support}</span>
								</label>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-agent-description">Descripción</Label>
						<Textarea
							id="edit-agent-description"
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							rows={2}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-agent-system-prompt">System prompt</Label>
						<Textarea
							id="edit-agent-system-prompt"
							value={formData.systemPrompt}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									systemPrompt: e.target.value,
								}))
							}
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="flex items-center justify-between rounded border p-3">
							<div>
								<p className="text-sm font-medium">Agente activo</p>
								<p className="text-xs text-muted-foreground">
									Si está inactivo no se podrá usar.
								</p>
							</div>
							<Switch
								checked={Boolean(formData.is_active)}
								onCheckedChange={(checked) =>
									setFormData((prev) => ({ ...prev, is_active: checked }))
								}
							/>
						</div>

						<div className="flex items-center justify-between rounded border p-3">
							<div>
								<p className="text-sm font-medium">Agente público</p>
								<p className="text-xs text-muted-foreground">
									Disponible para otros usuarios.
								</p>
							</div>
							<Switch
								checked={Boolean(formData.is_public)}
								onCheckedChange={(checked) =>
									setFormData((prev) => ({ ...prev, is_public: checked }))
								}
							/>
						</div>
					</div>

					{error && <p className="text-sm text-red-500">{error}</p>}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancelar
					</Button>
					<Button onClick={() => void handleSubmit()} disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Guardar cambios
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
