/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
} from "@/components/ui/card";
import {
	Sparkles,
	Globe,
	CheckCircle2,
	ChevronRight,
	ArrowLeft,
	Cpu,
} from "lucide-react";
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

const STEPS = [
	{
		id: 1,
		title: "Tipo de Agente",
		description: "Selecciona el motor de IA que utilizará tu agente",
	},
	{
		id: 2,
		title: "Información Básica",
		description: "Define el nombre y la configuración de tu agente",
	},
	{
		id: 3,
		title: "Capacidades",
		description: "Indica qué tipos de contenido puede procesar",
	},
	{
		id: 4,
		title: "Configuración Avanzada",
		description: "Personaliza el comportamiento del agente (opcional)",
	},
];

const PREDEFINED_AGENTS = [
	{
		id: "openrouter",
		label: "OpenRouter",
		icon: Cpu,
		description: "Acceso a múltiples modelos de IA",
		details: "GPT-4, Claude, Llama, Mistral y muchos más",
		url: "https://sysgd-production.up.railway.app/api/openrouter",
	},
	{
		id: "gemini",
		label: "Gemini",
		icon: Sparkles,
		description: "Modelo de Google",
		details: "Potente modelo de generación de contenido de Google",
		url: "https://sysgd-production.up.railway.app/api/generate",
	},
	{
		id: "custom",
		label: "Personalizado",
		icon: Globe,
		description: "Tu propia API",
		details: "Conecta con cualquier endpoint de API compatible",
		url: "",
	},
];

const SUPPORT_OPTIONS: {
	value: AgentSupport;
	label: string;
	description: string;
}[] = [
	{ value: "text", label: "Texto", description: "Mensajes y documentos de texto" },
	{ value: "image", label: "Imágenes", description: "Análisis y generación de imágenes" },
	{ value: "audio", label: "Audio", description: "Transcripción y análisis de audio" },
	{ value: "video", label: "Video", description: "Análisis de video en tiempo real" },
];

export const CreateAgentModal: FC<CreateAgentModalProps> = ({
	open,
	onOpenChange,
	onAgentCreated,
}) => {
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState<CreateAgentRequest>({
		name: "",
		url: "https://sysgd-production.up.railway.app/api/openrouter",
		support: ["text"],
		description: "",
		systemPrompt: "",
		is_public: false,
	});
	const [agentType, setAgentType] = useState<"openrouter" | "gemini" | "custom">(
		"openrouter",
	);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { createAgent, loading } = useAgents();

	const handleAgentTypeSelect = (type: "openrouter" | "gemini" | "custom") => {
		setAgentType(type);
		const agent = PREDEFINED_AGENTS.find((a) => a.id === type);
		if (agent) {
			setFormData((prev) => ({ ...prev, url: agent.url }));
		}
	};

	const validateStep = (step: number): boolean => {
		const newErrors: Record<string, string> = {};

		if (step === 2) {
			if (!formData.name.trim()) {
				newErrors.name = "El nombre es requerido";
			}
			if (agentType === "custom" && !formData.url.trim()) {
				newErrors.url = "La URL es requerida";
			} else if (agentType === "custom" && formData.url.trim()) {
				try {
					new URL(formData.url);
				} catch {
					newErrors.url = "La URL no es válida";
				}
			}
		}

		if (step === 3) {
			if (formData.support.length === 0) {
				newErrors.support = "Selecciona al menos una capacidad";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleNext = () => {
		if (validateStep(currentStep)) {
			setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
		}
	};

	const handleBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	const handleSubmit = async () => {
		if (!validateStep(3)) {
			return;
		}

		const agent = await createAgent(formData);
		if (agent) {
			onAgentCreated(agent);
			handleClose();
		}
	};

	const handleClose = () => {
		setFormData({
			name: "",
			url: "https://sysgd-production.up.railway.app/api/openrouter",
			support: ["text"],
			description: "",
			systemPrompt: "",
			is_public: false,
		});
		setAgentType("openrouter");
		setCurrentStep(1);
		setErrors({});
		onOpenChange(false);
	};

	const renderStepIndicator = () => (
		<div className="flex items-center justify-center gap-2 mb-6">
			{STEPS.map((step, index) => (
				<div key={step.id} className="flex items-center">
					<div
						className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
							currentStep > step.id
								? "bg-green-500 text-white"
								: currentStep === step.id
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground"
						}`}
					>
						{currentStep > step.id ? (
							<CheckCircle2 className="w-5 h-5" />
						) : (
							step.id
						)}
					</div>
					{index < STEPS.length - 1 && (
						<div
							className={`w-8 h-0.5 mx-1 ${
								currentStep > step.id ? "bg-green-500" : "bg-muted"
							}`}
						/>
					)}
				</div>
			))}
		</div>
	);

	const renderStep1 = () => (
		<div className="space-y-4">
			<div className="text-center mb-6">
				<h3 className="text-lg font-semibold">¿Qué tipo de agente deseas crear?</h3>
				<p className="text-sm text-muted-foreground">
					Selecciona el motor de IA que mejor se adapte a tus necesidades
				</p>
			</div>
			<div className="grid gap-3">
				{PREDEFINED_AGENTS.map((agent) => {
					const Icon = agent.icon;
					const isSelected = agentType === agent.id;
					return (
						<Card
							key={agent.id}
							className={`cursor-pointer transition-all hover:shadow-md ${
								isSelected
									? "border-primary bg-primary/5 ring-2 ring-primary"
									: "hover:border-primary/50"
							}`}
							onClick={() => handleAgentTypeSelect(agent.id as "openrouter" | "gemini" | "custom")}
						>
							<CardContent className="p-4 flex items-center gap-4">
								<div
									className={`p-3 rounded-lg ${
										isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
									}`}
								>
									<Icon className="w-6 h-6" />
								</div>
								<div className="flex-1">
									<div className="font-medium">{agent.label}</div>
									<div className="text-sm text-muted-foreground">
										{agent.description}
									</div>
									<div className="text-xs text-muted-foreground mt-1">
										{agent.details}
									</div>
								</div>
								{isSelected && (
									<CheckCircle2 className="w-5 h-5 text-primary" />
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);

	const renderStep2 = () => (
		<div className="space-y-4">
			<div className="text-center mb-6">
				<h3 className="text-lg font-semibold">Datos del Agente</h3>
				<p className="text-sm text-muted-foreground">
					Proporciona un nombre identificativo para tu agente
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="name">Nombre del Agente *</Label>
				<Input
					id="name"
					value={formData.name}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, name: e.target.value }))
					}
					placeholder="Ej: Asistente de Ventas, Analista de Datos..."
					className={errors.name ? "border-red-500" : ""}
				/>
				{errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
			</div>

			{agentType === "custom" && (
				<div className="space-y-2">
					<Label htmlFor="url">URL de la API *</Label>
					<Input
						id="url"
						value={formData.url}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, url: e.target.value }))
						}
						placeholder="https://tu-api.com/v1/chat/completions"
						className={errors.url ? "border-red-500" : ""}
					/>
					{errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
					<p className="text-xs text-muted-foreground">
						Tu API debe ser compatible con el formato OpenAI
					</p>
				</div>
			)}

			{agentType !== "custom" && (
				<div className="p-3 bg-muted rounded-lg">
					<p className="text-sm text-muted-foreground">
						<strong>Endpoint:</strong>{" "}
						<code className="text-xs bg-background px-1 py-0.5 rounded">
							{
								PREDEFINED_AGENTS.find((a) => a.id === agentType)
									?.url
							}
						</code>
					</p>
				</div>
			)}
		</div>
	);

	const renderStep3 = () => (
		<div className="space-y-4">
			<div className="text-center mb-6">
				<h3 className="text-lg font-semibold">Capabilidades del Agente</h3>
				<p className="text-sm text-muted-foreground">
					Selecciona los tipos de contenido que tu agente podrá procesar
				</p>
			</div>

			<div className="space-y-3">
				{SUPPORT_OPTIONS.map((option) => (
					<Card
						key={option.value}
						className={`cursor-pointer transition-all hover:shadow-md ${
							formData.support.includes(option.value)
								? "border-primary bg-primary/5 ring-2 ring-primary"
								: "hover:border-primary/50"
						}`}
						onClick={() => {
							setFormData((prev) => ({
								...prev,
								support: prev.support.includes(option.value)
									? prev.support.filter((s) => s !== option.value)
									: [...prev.support, option.value],
							}));
						}}
					>
						<CardContent className="p-4 flex items-center gap-4">
							<Checkbox
								checked={formData.support.includes(option.value)}
								onCheckedChange={(checked) => {
									setFormData((prev) => ({
										...prev,
										support: checked
											? [...prev.support, option.value]
											: prev.support.filter((s) => s !== option.value),
									}));
								}}
							/>
							<div className="flex-1">
								<div className="font-medium">{option.label}</div>
								<div className="text-sm text-muted-foreground">
									{option.description}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
			{errors.support && (
				<p className="text-sm text-red-500 text-center">{errors.support}</p>
			)}
		</div>
	);

	const renderStep4 = () => (
		<div className="space-y-4">
			<div className="text-center mb-6">
				<h3 className="text-lg font-semibold">Personalización (Opcional)</h3>
				<p className="text-sm text-muted-foreground">
					Configura el comportamiento específico de tu agente
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="systemPrompt">Instrucciones del Sistema</Label>
				<Textarea
					id="systemPrompt"
					value={formData.systemPrompt}
					onChange={(e) =>
						setFormData((prev) => ({
							...prev,
							systemPrompt: e.target.value,
						}))
					}
					placeholder="Eres un asistente de ventas especializado en productos tecnológicos. Responde de forma clara y concisa..."
					rows={4}
				/>
				<p className="text-xs text-muted-foreground">
					Estas instrucciones definen cómo se comportará el agente
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Descripción</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) =>
						setFormData((prev) => ({
							...prev,
							description: e.target.value,
						}))
					}
					placeholder="Breve descripción de las capacidades del agente..."
					rows={2}
				/>
			</div>

			<div className="flex items-center justify-between rounded-lg border p-3">
				<div>
					<p className="text-sm font-medium">Hacer agente público</p>
					<p className="text-xs text-muted-foreground">
						Otros usuarios podrán encontrarlo y usarlo.
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
	);

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return renderStep1();
			case 2:
				return renderStep2();
			case 3:
				return renderStep3();
			case 4:
				return renderStep4();
			default:
				return null;
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto no-scrollbar">
				<DialogHeader className="shrink-0 text-center">
					<DialogTitle className="flex items-center justify-center gap-2">
						<Cpu className="w-5 h-5" />
						Crear Nuevo Agente
					</DialogTitle>
					<DialogDescription>
						Paso {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].title}
					</DialogDescription>
				</DialogHeader>

				{renderStepIndicator()}

				<div className="min-h-[280px]">{renderCurrentStep()}</div>

				<DialogFooter className="shrink-0 pt-4">
					{currentStep > 1 && (
						<Button
							type="button"
							variant="outline"
							onClick={handleBack}
							className="gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							Atrás
						</Button>
					)}
					<div className="flex-1" />
					{currentStep < STEPS.length ? (
						<Button type="button" onClick={handleNext} className="gap-2">
							Siguiente
							<ChevronRight className="w-4 h-4" />
						</Button>
					) : (
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={loading}
							className="gap-2"
						>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Crear Agente
							<CheckCircle2 className="w-4 h-4" />
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
