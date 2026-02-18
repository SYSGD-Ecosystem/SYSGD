import {
	BookOpen,
	Code2,
	FileText,
	Github,
	HelpCircle,
	LifeBuoy,
	MessageSquare,
	Rocket,
	ShieldCheck,
	Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type HelpCategoryId = "help" | "api" | "updates";

type HelpItem = {
	id: string;
	title: string;
	category: HelpCategoryId;
	summary: string;
	content: string[];
	icon: React.ReactNode;
};

export default function HelpPage() {
	const [activeCategory, setActiveCategory] = useState<HelpCategoryId>("help");
	const [activeItemId, setActiveItemId] = useState<string>("quick-start");
	const [search, setSearch] = useState("");

	const categories = useMemo(
		() => [
			{
				id: "help" as const,
				label: "Ayuda",
				icon: <HelpCircle className="h-4 w-4" />,
			},
			{
				id: "api" as const,
				label: "API",
				icon: <Code2 className="h-4 w-4" />,
			},
			{
				id: "updates" as const,
				label: "Actualizaciones",
				icon: <Zap className="h-4 w-4" />,
			},
		],
		[],
	);

	const items = useMemo<HelpItem[]>(
		() => [
			{
				id: "quick-start",
				title: "Guía rápida de uso",
				category: "help",
				summary: "Cómo empezar a usar SYSGD en pocos pasos.",
				icon: <Rocket className="h-4 w-4" />,
				content: [
					"SYSGD centraliza trabajo colaborativo, tareas, notas, documentos y chat.",
					"",
					"Flujo recomendado para nuevos usuarios:",
					"1) Inicia sesión y verifica tu perfil en Configuración.",
					"2) Crea o únete a un proyecto.",
					"3) Usa tareas/notas para organizar trabajo interno.",
					"4) Usa Chat interno para comunicación de equipo.",
					"5) Usa Chat con agentes para apoyo IA especializado.",
				],
			},
			{
				id: "chat-internal-vs-agents",
				title: "Chat interno vs Chat con agentes",
				category: "help",
				summary: "Qué hace cada módulo y cuándo usarlo.",
				icon: <MessageSquare className="h-4 w-4" />,
				content: [
					"Chat interno: conversaciones entre miembros del equipo (persona a persona).",
					"Chat con agentes: conversaciones asistidas por IA para soporte, análisis o ejecución guiada.",
					"",
					"Buenas prácticas:",
					"- Usa chat interno para coordinación diaria y decisiones de equipo.",
					"- Usa chat con agentes cuando necesites ayuda IA, prompts o automatización.",
					"- Crea una conversación por tema y luego selecciona/cambia el agente según convenga.",
				],
			},
			{
				id: "tokens-and-credits",
				title: "Tokens personalizados y créditos",
				category: "help",
				summary: "Prioridad de token del usuario y consumo de créditos.",
				icon: <ShieldCheck className="h-4 w-4" />,
				content: [
					"Puedes guardar tokens personales (por ejemplo Gemini u OpenRouter) desde Configuración.",
					"",
					"Regla de uso:",
					"- Si existe token personal válido para el proveedor, el sistema lo prioriza.",
					"- Si no existe, se usa el token del sistema.",
					"",
					"Créditos IA:",
					"- No se descuentan créditos cuando usas token personal.",
					"- Sí se descuentan cuando se usa token del sistema.",
				],
			},
			{
				id: "support",
				title: "Soporte y resolución de problemas",
				category: "help",
				summary: "Qué revisar si algo falla y cómo pedir ayuda.",
				icon: <LifeBuoy className="h-4 w-4" />,
				content: [
					"Si un módulo no responde correctamente:",
					"- Verifica conexión y sesión activa.",
					"- Revisa que el token API esté guardado si usas agentes IA.",
					"- Comprueba permisos del proyecto/equipo.",
					"",
					"Si persiste el problema, reporta:",
					"- Ruta y acción exacta realizada.",
					"- Mensaje de error mostrado.",
					"- Hora aproximada del fallo.",
				],
			},
			{
				id: "api-auth-and-users",
				title: "API: autenticación y usuarios",
				category: "api",
				summary: "Registro/login, perfil y métricas de uso.",
				icon: <Code2 className="h-4 w-4" />,
				content: [
					"Base URL: {SERVER_URL}/api",
					"Autenticación: Bearer token (Authorization) o sesión según flujo.",
					"",
					"Endpoints principales:",
					"- /api/auth/* (login, OAuth, etc.)",
					"- /api/users/me (usuario actual)",
					"- /api/users/usage (resumen de uso y créditos)",
					"- /api/users/plan (plan del usuario)",
					"- /api/users/public-users (listado público)",
				],
			},
			{
				id: "api-collaboration",
				title: "API: colaboración (proyectos, tareas, notas)",
				category: "api",
				summary: "Operaciones base para gestión del trabajo.",
				icon: <BookOpen className="h-4 w-4" />,
				content: [
					"Dominios principales:",
					"- /api/projects/*",
					"- /api/tasks/*",
					"- /api/ideas/*",
					"- /api/notes/* y /api/projects/:id/notes",
					"- /api/members/* e /api/invitations/*",
					"",
					"IA en tareas:",
					"- /api/tasks/generate (generación asistida)",
				],
			},
			{
				id: "api-chat-and-agents",
				title: "API: chat y agentes IA",
				category: "api",
				summary: "Conversaciones internas y flujo de agentes.",
				icon: <MessageSquare className="h-4 w-4" />,
				content: [
					"Chat interno:",
					"- /api/chat/*",
					"",
					"Agentes:",
					"- /api/agents/* (CRUD de agentes y mensajes)",
					"- /api/agents/message (envío centralizado desde backend)",
					"",
					"Proveedores IA disponibles:",
					"- /api/openrouter",
					"- /api/openrouterai",
					"- /api/generate (flujo Gemini)",
					"- /api/qwen",
				],
			},
			{
				id: "api-files-and-integrations",
				title: "API: archivos, tokens e integraciones",
				category: "api",
				summary: "Uploads, GitHub, tokens y otros módulos.",
				icon: <FileText className="h-4 w-4" />,
				content: [
					"Archivos:",
					"- /api/uploads",
					"- /api/upload",
					"",
					"Integraciones y configuración:",
					"- /api/github/*",
					"- /api/tokens/* (guardar/eliminar/listar tokens)",
					"- /api/verification/*",
					"- /api/crypto-payments/*",
					"- /api/time-entries/*",
				],
			},
			{
				id: "updates-recent",
				title: "Novedades recientes",
				category: "updates",
				summary: "Resumen de mejoras funcionales visibles para usuarios.",
				icon: <Zap className="h-4 w-4" />,
				content: [
					"- Mejora del módulo de chat con separación entre chat interno y chat con agentes.",
					"- Flujo de agentes más claro: conversación por tema + selección/cambio de agente.",
					"- Soporte para tokens personalizados de proveedores IA en configuración.",
					"- Mejoras visuales y de responsividad en componentes principales de chat.",
				],
			},
		],
		[],
	);

	const filteredItems = useMemo(() => {
		const base = items.filter((i) => i.category === activeCategory);
		const q = search.trim().toLowerCase();
		if (!q) return base;
		return base.filter(
			(i) =>
				i.title.toLowerCase().includes(q) ||
				i.summary.toLowerCase().includes(q) ||
				i.content.join(" ").toLowerCase().includes(q),
		);
	}, [items, activeCategory, search]);

	const activeItem = useMemo(() => {
		return (
			items.find((i) => i.id === activeItemId) || filteredItems[0] || items[0]
		);
	}, [items, activeItemId, filteredItems]);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Centro de ayuda</h1>
						<p className="text-muted-foreground mt-2">
							Guías funcionales del sistema y referencia de endpoints API por módulos.
						</p>
					</div>
					<Button variant="outline" asChild>
						<Link to="/landpage">Volver</Link>
					</Button>
				</div>

				<Separator className="my-6" />

				<div className="flex flex-wrap gap-2">
					{categories.map((c) => (
						<Button
							key={c.id}
							variant={activeCategory === c.id ? "default" : "outline"}
							onClick={() => {
								setActiveCategory(c.id);
								const first = items.find((i) => i.category === c.id);
								if (first) setActiveItemId(first.id);
							}}
							className="gap-2"
						>
							{c.icon}
							{c.label}
						</Button>
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
					<Card className="lg:col-span-4">
						<CardHeader className="space-y-3">
							<CardTitle className="text-base">Índice</CardTitle>
							<Input
								placeholder="Buscar en esta categoría..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</CardHeader>
						<CardContent className="pt-0">
							<ScrollArea className="h-[520px] pr-3">
								<div className="space-y-2">
									{filteredItems.map((i) => (
										<button
											key={i.id}
											type="button"
											onClick={() => setActiveItemId(i.id)}
											className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-muted ${
												activeItemId === i.id ? "border-primary" : "border-border"
											}`}
										>
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground">{i.icon}</span>
													<span className="font-medium">{i.title}</span>
												</div>
												<Badge variant="secondary" className="shrink-0">
													{i.category.toUpperCase()}
												</Badge>
											</div>
											<p className="text-sm text-muted-foreground mt-2">{i.summary}</p>
										</button>
									))}

									{filteredItems.length === 0 && (
										<div className="text-sm text-muted-foreground p-3">No hay resultados.</div>
									)}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>

					<Card className="lg:col-span-8">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="text-muted-foreground">{activeItem.icon}</span>
								{activeItem.title}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{activeItem.content.map((line, idx) => (
									<p key={`${activeItem.id}-${idx}`} className="text-sm leading-6">
										{line}
									</p>
								))}
							</div>

							<Separator className="my-6" />

							<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
								<div className="text-sm text-muted-foreground">
									Soporte:{" "}
									<a
										className="underline underline-offset-4"
										href="mailto:lazaroyunier96@gmail.com"
									>
										lazaroyunier96@gmail.com
									</a>
								</div>
								<Button variant="outline" asChild className="gap-2">
									<Link to="https://github.com/lazaroysr96/sysgd/" target="_blank">
										<Github className="h-4 w-4" />
										GitHub
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
