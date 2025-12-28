"use client";

import { Loader2 } from "lucide-react";
import { type FC, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type {
	Agent,
	AgentSupport,
	CreateAgentRequest,
} from "../../types/Agent";
import { useAgents } from "../hooks/useAgents";

interface CreateAgentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAgentCreated: (agent: Agent) => void;
}

export const CreateAgentModal: FC<CreateAgentModalProps> = ({
	open,
	onOpenChange,
	onAgentCreated,
}) => {
	const [formData, setFormData] = useState<CreateAgentRequest>({
		name: "",
		url: "",
		support: [],
		description: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { createAgent, loading } = useAgents();

	const supportOptions: {
		value: AgentSupport;
		label: string;
		description: string;
	}[] = [
		{ value: "text", label: "Texto", description: "Procesa mensajes de texto" },
		{ value: "image", label: "Imágenes", description: "Procesa imágenes" },
		{
			value: "audio",
			label: "Audio",
			description: "Procesa archivos de audio",
		},
		{
			value: "video",
			label: "Video",
			description: "Procesa archivos de video",
		},
	];

	const handleSupportChange = (support: AgentSupport, checked: boolean) => {
		setFormData((prev) => ({
			...prev,
			support: checked
				? [...prev.support, support]
				: prev.support.filter((s) => s !== support),
		}));
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = "El nombre es requerido";
		}

		if (!formData.url.trim()) {
			newErrors.url = "La URL es requerida";
		} else {
			try {
				new URL(formData.url);
			} catch {
				newErrors.url = "La URL no es válida";
			}
		}

		if (formData.support.length === 0) {
			newErrors.support = "Debe seleccionar al menos un tipo de soporte";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		const agent = await createAgent(formData);
		if (agent) {
			onAgentCreated(agent);
			setFormData({
				name: "",
				url: "",
				support: [],
				description: "",
			});
			setErrors({});
		}
	};

	const handleClose = () => {
		setFormData({
			name: "",
			url: "",
			support: [],
			description: "",
		});
		setErrors({});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Crear Nuevo Agente</DialogTitle>
					<DialogDescription>
						Configura un nuevo agente de IA que se integrará con el sistema de
						chat.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Nombre del Agente</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="Ej: Asistente de Ventas"
							className={errors.name ? "border-red-500" : ""}
						/>
						{errors.name && (
							<p className="text-sm text-red-500">{errors.name}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="url">URL del Agente</Label>
						<Input
							id="url"
							value={formData.url}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, url: e.target.value }))
							}
							placeholder="https://api.ejemplo.com/agent"
							className={errors.url ? "border-red-500" : ""}
						/>
						{errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
						<p className="text-xs text-muted-foreground">
							La URL debe ser un endpoint que acepte peticiones POST con el
							formato estándar.
						</p>
					</div>

					<div className="space-y-2">
						<Label>Tipos de Soporte</Label>
						<div className="grid grid-cols-2 gap-3">
							{supportOptions.map((option) => (
								<div key={option.value} className="flex items-start space-x-2">
									<Checkbox
										id={option.value}
										checked={formData.support.includes(option.value)}
										onCheckedChange={(checked) =>
											handleSupportChange(option.value, checked as boolean)
										}
									/>
									<div className="space-y-1">
										<Label
											htmlFor={option.value}
											className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										>
											{option.label}
										</Label>
										<p className="text-xs text-muted-foreground">
											{option.description}
										</p>
									</div>
								</div>
							))}
						</div>
						{errors.support && (
							<p className="text-sm text-red-500">{errors.support}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Descripción (Opcional)</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							placeholder="Describe las capacidades del agente..."
							rows={3}
						/>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancelar
						</Button>
						<Button type="submit" disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Crear Agente
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
