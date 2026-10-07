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
import {
	findApiDocs,
	API_DOCS_STATS,
	type ApiEndpointDoc,
} from "@/data/api-docs.generated";
import { SERVER_URL } from "@/utils/util";

type HelpCategoryId = "help" | "api" | "updates";

const VERB_COLOR: Record<string, string> = {
	GET: "text-sky-600 dark:text-sky-400",
	POST: "text-emerald-600 dark:text-emerald-400",
	PUT: "text-amber-600 dark:text-amber-400",
	PATCH: "text-violet-600 dark:text-violet-400",
	DELETE: "text-rose-600 dark:text-rose-400",
};

type HelpItem = {
	id: string;
	title: string;
	category: HelpCategoryId;
	summary: string;
	content: string[];
	icon: React.ReactNode;
};

const PARAM_GROUP: Record<string, string> = {
	path: "en la ruta",
	query: "en la query",
	body: "en el body",
};

const PARAM_GROUP_ORDER = ["path", "query", "body"];

function ApiParams({ docs }: { docs?: ApiEndpointDoc }) {
	if (!docs || docs.params.length === 0) return null;

	const groups = PARAM_GROUP_ORDER.map((where) => ({
		where,
		items: docs.params.filter((p) => p.in === where),
	})).filter((g) => g.items.length > 0);

	return (
		<div className="space-y-1.5 rounded-md border border-dashed border-border/70 bg-background/40 px-2 py-2">
			{groups.map((g) => (
				<div key={g.where} className="space-y-1">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
						{PARAM_GROUP[g.where]}
					</p>
					{g.items.map((p) => (
						<div
							key={`${p.in}-${p.name}`}
							className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-mono text-[12.5px] leading-5"
						>
							<span className="text-foreground">{p.name}</span>
							<span className="text-muted-foreground">{p.type}</span>
							{p.required ? (
								<span className="font-sans text-[11px] font-medium text-amber-600 dark:text-amber-400">
									obligatorio
								</span>
							) : (
								<span className="font-sans text-[11px] text-muted-foreground/70">
									opcional
								</span>
							)}
							{p.constraint && (
								<span className="font-sans text-[11px] text-muted-foreground/80">
									({p.constraint})
								</span>
							)}
							{p.default !== undefined && (
								<span className="font-sans text-[11px] text-muted-foreground/80">
									por defecto {p.default}
								</span>
							)}
						</div>
					))}
				</div>
			))}
			{docs.auth.length > 0 && (
				<p className="font-sans text-[11px] text-muted-foreground/80">
					Permisos: {docs.auth.join(", ")}
				</p>
			)}
		</div>
	);
}

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
				id: "api-base",
				title: "API: base, autenticación y convenciones",
				category: "api",
				summary: "Base URL, cómo enviar el token, errores y ejemplo mínimo.",
				icon: <Code2 className="h-4 w-4" />,
				content: [
					`Base URL: ${SERVER_URL}/api`,
					"Cuerpos de petición y respuesta en JSON (Content-Type: application/json), salvo la subida de archivos, que es multipart/form-data.",
					"",
					"Autenticación:",
					"- Header: Authorization: Bearer <token>",
					"- Cookie de sesión: token=<jwt> (el cliente web usa las dos vías).",
					"- El token se obtiene en POST /api/auth/login y dura 30 días (7 días si el usuario es admin).",
					"",
					"Ejemplo mínimo:",
					`curl -s -X POST ${SERVER_URL}/api/auth/login -H 'Content-Type: application/json' -d '{"email":"correo","password":"clave"}'`,
					`curl -s ${SERVER_URL}/api/projects -H "Authorization: Bearer $TOKEN"`,
					"",
					"Errores que hay que conocer:",
					"- 401 Token no proporcionado: falta el header o la cookie.",
					"- 401/403 Token inválido o expirado: hay que volver a hacer login.",
					"- 402 Contraseña incorrecta: la respuesta incluye los intentos restantes.",
					"- 423 Cuenta bloqueada: hubo demasiados intentos fallidos; esperar el Retry-After.",
					"- 403 Acceso denegado: los administradores solo pueden iniciar sesión desde Cuba.",
					"- 500 Error interno del servidor: revisa el log del servidor con la hora exacta.",
					"",
					"Convenciones:",
					"- Los endpoints marcados (público) no necesitan token; el resto devuelve 401 sin él.",
					"- Los que consumen IA pasan por checkAICredits (sin saldo responden 402) y los que crean tareas por checkTaskLimit.",
					"- Los parámetros de ruta van con dos puntos: /api/tasks/:taskId.",
					"- Los routers se montan en server/src/routes/index.ts; cada archivo es un módulo del dominio.",
					"- La referencia completa son los ~220 endpoints repartidos en 38 módulos; esta página los agrupa por dominio.",
				],
			},
			{
				id: "api-auth",
				title: "API: autenticación, 2FA y verificación",
				category: "api",
				summary: "Login, registro, sesiones, 2FA y recuperación de contraseña.",
				icon: <ShieldCheck className="h-4 w-4" />,
				content: [
					"Sesión:",
					"POST /api/auth/login — Inicia sesión y devuelve { token, user } (público).",
					"POST /api/auth/check-user — Comprueba si un correo ya existe (público).",
					"No hay POST /api/auth/register: esa ruta está comentada en el servidor. El alta real es POST /api/users/register.",
					"POST /api/auth/complete-registration — Completa el registro de una cuenta invitada (público).",
					"GET /api/auth/me — Usuario de la sesión actual.",
					"POST /api/auth/logout — Cierra la sesión del cliente (público).",
					"POST /api/auth/external-token — Emite un token para clientes externos (apps Android, escritorio).",
					"",
					"Doble factor:",
					"POST /api/auth/verify-2fa — Valida el código y devuelve el token final (público).",
					"POST /api/auth/resend-2fa — Reenvía el código de verificación (público).",
					"GET /api/auth/2fa/status — Estado del 2FA del usuario.",
					"PUT /api/auth/2fa/status — Activa o desactiva el 2FA.",
					"Flujo: el login responde 202 con { twoFactorToken, requiresTwoFactor }; ese token se manda a /api/auth/verify-2fa junto con el código.",
					"",
					"Cuenta:",
					"PUT /api/auth/password — Cambia la contraseña.",
					"DELETE /api/auth/account — Elimina la cuenta propia.",
					"",
					"Verificación de correo y recuperación:",
					"POST /api/verification/verify-email — Confirma el correo con el código recibido.",
					"POST /api/verification/request-password-reset — Pide el enlace de restablecimiento.",
					"POST /api/verification/reset-password — Cambia la clave con el token recibido.",
					"POST /api/verification/resend-verification — Reenvía el correo de verificación.",
					"GET /api/verification/status — Estado de la verificación.",
				],
			},
			{
				id: "api-users",
				title: "API: usuarios, perfil, créditos y planes",
				category: "api",
				summary: "Perfil propio, listados y administración de usuarios.",
				icon: <Code2 className="h-4 w-4" />,
				content: [
					"Perfil propio:",
					"GET /api/users/me — Usuario de la sesión.",
					"GET /api/users/data — Datos completos del perfil.",
					"GET /api/users/usage — Uso del mes y créditos restantes.",
					"GET /api/users/plan — Plan contratado.",
					"PUT /api/users/public — Perfil público o privado.",
					"PUT /api/users/me/credit-priority — Prioriza el token personal al gastar créditos.",
					"GET /api/users/public-users — Directorio de usuarios públicos.",
					"",
					"Administración (requiere admin):",
					"GET /api/users — Listado de usuarios.",
					"POST /api/users — Crea un usuario.",
					"PUT /api/users/:id — Actualiza nombre, correo, rol o estado.",
					"DELETE /api/users/:id — Elimina el usuario.",
					"PUT /api/users/:id/plan — Cambia el plan.",
					"POST /api/users/:id/credits — Abona o descuenta créditos.",
					"PUT /api/users/:id/password — Fija una contraseña.",
					"POST /api/users/register — Alta directa desde el panel.",
					"",
					"Métricas de plataforma (admin):",
					"GET /api/admin/users — Usuarios con métricas.",
					"POST /api/admin/users — Alta desde administración.",
					"PUT /api/admin/users/:id — Modifica un usuario.",
					"DELETE /api/admin/users/:id — Elimina un usuario.",
					"GET /api/admin/metrics — Métricas agregadas.",
					"GET /api/admin/analytics — Analítica de uso.",
					"",
					"Regla de créditos: si el usuario tiene un token personal válido del proveedor se usa ese y no se descuentan créditos; si se recurre al token del sistema, sí se descuentan.",
				],
			},
			{
				id: "api-projects-tasks",
				title: "API: proyectos, tareas, notas y equipo",
				category: "api",
				summary: "El núcleo de gestión: proyectos, tareas, configuración, notas e invitaciones.",
				icon: <BookOpen className="h-4 w-4" />,
				content: [
					"Proyectos:",
					"GET /api/projects — Proyectos del usuario.",
					"POST /api/projects — Crea un proyecto (name y description son obligatorios).",
					"GET /api/projects/:id — Detalle de un proyecto.",
					"PUT /api/projects/:id — Actualiza un proyecto.",
					"DELETE /api/projects/:id — Elimina un proyecto.",
					"POST /api/projects/:projectId/create-conversation — Crea el chat asociado al proyecto.",
					"",
					"Tareas:",
					"GET /api/tasks/:project_id — Tareas de un proyecto.",
					"POST /api/tasks — Crea una tarea (title y project_id son obligatorios).",
					"PUT /api/tasks/:taskId — Actualiza una tarea o le cambia el estado.",
					"DELETE /api/tasks/:taskId — Elimina una tarea.",
					"POST /api/tasks/generate — Genera tareas con IA (descuenta créditos).",
					"El project_task_number se numera dentro de cada proyecto, no de forma global.",
					"",
					"Configuración de tareas por proyecto:",
					"GET /api/projects/:projectId/task-config — Tipos, estados y prioridades.",
					"PUT /api/projects/:projectId/task-config — Guarda la configuración completa.",
					"POST /api/projects/:projectId/task-config/types — Añade un tipo.",
					"DELETE /api/projects/:projectId/task-config/types/:typeName — Quita un tipo.",
					"POST /api/projects/:projectId/task-config/states — Añade un estado.",
					"DELETE /api/projects/:projectId/task-config/states/:stateName — Quita un estado.",
					"POST /api/projects/:projectId/task-config/priorities — Añade una prioridad.",
					"DELETE /api/projects/:projectId/task-config/priorities/:priorityName — Quita una prioridad.",
					"",
					"Notas e ideas:",
					"GET /api/projects/:id/notes — Notas del proyecto (con autor y correo).",
					"POST /api/projects/:id/notes — Crea una nota.",
					"PUT /api/notes/:id — Actualiza una nota.",
					"DELETE /api/notes/:id — Elimina una nota.",
					"GET /api/ideas/:projectId — Ideas del proyecto.",
					"POST /api/ideas/:projectId — Crea una idea.",
					"PUT /api/ideas/:ideaId — Actualiza una idea.",
					"DELETE /api/ideas/:ideaId — Elimina una idea.",
					"",
					"Equipo e invitaciones:",
					"GET /api/members/:projectId — Miembros del proyecto.",
					"POST /api/members/invite/:projectId — Invita a un usuario.",
					"POST /api/members/accept-invite/:invitationId — Acepta la invitación.",
					"GET /api/members/status — Estado del módulo (público).",
					"GET /api/invitations — Invitaciones recibidas por el usuario.",
					"POST /api/invitations/accept — Acepta una invitación.",
					"GET /api/invitations/verify-token — Valida el token de invitación (público).",
				],
			},
			{
				id: "api-chat",
				title: "API: chat interno",
				category: "api",
				summary: "Conversaciones, mensajes, miembros e invitaciones.",
				icon: <MessageSquare className="h-4 w-4" />,
				content: [
					"Conversaciones:",
					"GET /api/chat/conversations — Conversaciones del usuario.",
					"POST /api/chat/conversations/create — Crea una conversación.",
					"No hay GET /api/chat/conversations/:id: el detalle se obtiene con PUT/DELETE o los mensajes.",
					"PUT /api/chat/conversations/:conversationId — Renombra o actualiza.",
					"DELETE /api/chat/conversations/:conversationId — Elimina la conversación.",
					"POST /api/chat/conversations/:conversationId/read — Marca la conversación como leída.",
					"GET /api/chat/conversations/user/:userId — Conversaciones con un usuario concreto.",
					"",
					"Mensajes:",
					"GET /api/chat/messages/:conversationId — Mensajes de la conversación.",
					"POST /api/chat/messages/send — Envía un mensaje.",
					"DELETE /api/chat/messages/:messageId — Elimina un mensaje.",
					"",
					"Miembros e invitaciones:",
					"POST /api/chat/conversations/:conversationId/members — Añade un miembro.",
					"DELETE /api/chat/conversations/:conversationId/members/:userId — Quita un miembro.",
					"POST /api/chat/conversations/invite — Invita por correo.",
					"GET /api/chat/conversations/invitations — Invitaciones pendientes.",
					"POST /api/chat/conversations/invite/accept — Acepta la invitación.",
					"GET /api/chat/invites/validate/:token — Valida la invitación (público).",
					"",
					"Este módulo es el chat entre personas; la IA se maneja aparte, en Agentes (siguiente página).",
				],
			},
			{
				id: "api-agents-ai",
				title: "API: agentes y proveedores de IA",
				category: "api",
				summary: "Agentes, capa genérica de IA y todos los proveedores.",
				icon: <Rocket className="h-4 w-4" />,
				content: [
					"Agentes:",
					"GET /api/agents — Agentes del usuario.",
					"POST /api/agents — Crea un agente.",
					"GET /api/agents/:id — Detalle de un agente.",
					"PUT /api/agents/:id — Actualiza un agente.",
					"DELETE /api/agents/:id — Elimina un agente.",
					"GET /api/agents/public — Agentes públicos del sistema.",
					"POST /api/agents/message — Envía un mensaje al agente (descuenta créditos).",
					"",
					"Capa genérica de IA:",
					"GET /api/ai/models — Modelos disponibles por proveedor.",
					"POST /api/ai/completions — Completado con el proveedor, modelo y systemPrompt que elija el cliente (descuenta créditos).",
					"",
					"Proveedores:",
					"POST /api/generate/ — Flujo Gemini.",
					"POST /api/generate/text — Gemini solo texto (descuenta créditos).",
					"POST /api/generate/analyze — Análisis de un texto.",
					"POST /api/qwen/ — Flujo Qwen.",
					"POST /api/gema/ — Flujo Gemma.",
					"POST /api/openrouter/ — OpenRouter (descuenta créditos).",
					"POST /api/openrouterai/ — OpenRouter, variante que usa el cliente web.",
					"",
					"Generación con IA dentro de otros módulos:",
					"POST /api/tasks/generate — Crea tareas a partir de una descripción.",
					"POST /api/updates/generate — Redacta notas de actualización.",
					"",
					"Tokens y créditos:",
					"- Si el usuario guardó un token personal para el proveedor (POST /api/tokens), se usa ese y no se descuentan créditos.",
					"- Si no hay token personal, se usa el del sistema y se descuentan créditos del plan.",
					"- Sin saldo, los endpoints con checkAICredits responden 402.",
				],
			},
			{
				id: "api-files-integrations",
				title: "API: archivos, tokens, GitHub y tiempos",
				category: "api",
				summary: "Uploads, tokens de proveedores, GitHub, control de horas y licencias.",
				icon: <Github className="h-4 w-4" />,
				content: [
					"Archivos:",
					"POST /api/upload/ — Sube un archivo (multipart/form-data).",
					"DELETE /api/upload/:key — Elimina un archivo por su clave.",
					"El módulo responde igual en /api/upload y en /api/uploads.",
					"",
					"Tokens de proveedores:",
					"GET /api/tokens — Tokens guardados por el usuario.",
					"POST /api/tokens — Guarda un token (Gemini, OpenRouter, etc.).",
					"DELETE /api/tokens/:id — Elimina un token.",
					"",
					"GitHub:",
					"POST /api/github/validate — Valida un repositorio.",
					"POST /api/github/repository — Datos del repositorio.",
					"POST /api/github/pull-requests — Pull requests del repositorio.",
					"POST /api/github/metrics — Métricas del repositorio.",
					"GET /api/github/project-config/:projectId — Configuración de GitHub del proyecto.",
					"POST /api/github/project-config — Guarda la configuración.",
					"DELETE /api/github/project-config/:projectId — Elimina la configuración.",
					"POST /api/github/user-token — Guarda el token de GitHub del usuario.",
					"GET /api/github/user-token/:projectId/status — Estado de ese token.",
					"DELETE /api/github/user-token/:projectId — Elimina el token.",
					"",
					"Control de horas:",
					"POST /api/time-entries/start — Arranca un registro de tiempo.",
					"POST /api/time-entries — Crea un registro manual.",
					"GET /api/time-entries — Listado con filtros.",
					"PUT /api/time-entries/:id — Actualiza el registro.",
					"PUT /api/time-entries/:id/pause — Pausa el registro.",
					"PUT /api/time-entries/:id/resume — Reanuda el registro.",
					"PUT /api/time-entries/:id/stop — Detiene y calcula el total.",
					"DELETE /api/time-entries/:id — Elimina el registro.",
					"",
					"Licencias:",
					"GET /api/licenses — Licencias del usuario.",
					"POST /api/licenses/generate — Genera una licencia.",
				],
			},
			{
				id: "api-accounting",
				title: "API: contabilidad (GCTCP)",
				category: "api",
				summary: "Espacios de trabajo, libro mayor, turnos, documentos y nomenclátor.",
				icon: <FileText className="h-4 w-4" />,
				content: [
					"Espacios de trabajo:",
					"GET /api/cont-workspaces — Espacios del usuario.",
					"POST /api/cont-workspaces — Crea un espacio de trabajo.",
					"GET /api/cont-workspaces/:id — Detalle del espacio.",
					"PUT /api/cont-workspaces/:id/name — Renombra el espacio.",
					"DELETE /api/cont-workspaces/:id — Elimina el espacio.",
					"GET /api/cont-workspaces/:id/ledger — Libro mayor del espacio.",
					"PUT /api/cont-workspaces/:id/ledger — Guarda el libro mayor.",
					"GET /api/cont-workspaces/:id/members — Miembros del espacio.",
					"POST /api/cont-workspaces/:id/members/invite — Invita a un miembro.",
					"PATCH /api/cont-workspaces/:id/members/:userId — Cambia el rol del miembro.",
					"DELETE /api/cont-workspaces/:id/members/:userId — Quita al miembro.",
					"GET /api/cont-workspaces/:id/vendedores/links — Vendedores vinculados.",
					"PUT /api/cont-workspaces/:id/vendedores/:vendedorId/link — Vincula un vendedor.",
					"DELETE /api/cont-workspaces/:id/vendedores/:vendedorId/link — Desvincula un vendedor.",
					"",
					"Libro mayor y turnos:",
					"GET /api/cont-ledger — Libro mayor del usuario.",
					"PUT /api/cont-ledger — Guarda el libro mayor.",
					"GET /api/cont-turnos/:id/reportes-turno — Reportes de un turno.",
					"POST /api/cont-turnos/:id/reportes-turno — Crea un reporte de turno.",
					"PATCH /api/cont-turnos/:id/reportes-turno/:reporteId — Actualiza un reporte.",
					"GET /api/cont-turnos/:id/informe-disponibilidad — Informe de disponibilidad.",
					"PUT /api/cont-turnos/:id/informe-disponibilidad — Guarda el informe.",
					"",
					"Documentos contables:",
					"GET /api/accounting-documents — Lista los documentos.",
					"POST /api/accounting-documents — Crea un documento.",
					"GET /api/accounting-documents/:id — Detalle del documento.",
					"PUT /api/accounting-documents/:id — Guarda el documento.",
					"POST /api/accounting-documents/pdf/tcp — Genera el PDF del documento.",
					"",
					"Nomenclátor y organigrama:",
					"GET /api/nomenclators/accounting/categories — Catálogo de categorías.",
					"GET /api/nomenclators/accounting/subcategories — Subcategorías.",
					"GET /api/nomenclators/accounting/search — Busca en el catálogo contable.",
					"GET /api/nomenclators/cnae/search — Busca por código CNAE.",
					"GET /api/organization — Organigrama de la empresa.",
					"POST /api/organization — Guarda el organigrama.",
					"",
					"Permisos: los endpoints de un espacio (/api/cont-workspaces/:id/...) validan con hasWorkspaceAccess que el usuario pertenezca al espacio o sea admin.",
					"API heredada: src/routes/api.ts está marcada como deprecated; solo sirve para los documentos y archivos antiguos de GCTCP (archives, get-document-entry, get-document-exit, get-document-loan, get-document-topographic, retention-schedule, classification).",
				],
			},
			{
				id: "api-payments-community",
				title: "API: pagos, actualizaciones y comunidad",
				category: "api",
				summary: "Cripto y pagos manuales, novedades, Descubre y avisos.",
				icon: <LifeBuoy className="h-4 w-4" />,
				content: [
					"Pagos con cripto:",
					"GET /api/crypto-payments/network — Red y configuración del servicio.",
					"GET /api/crypto-payments/service/status — Estado del listener.",
					"GET /api/crypto-payments/products — Catálogo de productos.",
					"GET /api/crypto-payments/products/:productId — Detalle de un producto.",
					"POST /api/crypto-payments/orders — Crea una orden de pago.",
					"GET /api/crypto-payments/orders — Órdenes del usuario.",
					"GET /api/crypto-payments/orders/:orderId — Estado de una orden.",
					"GET /api/crypto-payments/balance/:address — Saldo de una dirección.",
					"GET /api/crypto-payments/allowance/:address — Allowance de una dirección.",
					"GET /api/crypto-payments/faucet/cooldown/:address — Enfriamiento del faucet.",
					"",
					"Pagos manuales:",
					"GET /api/manual-payments/products — Catálogo.",
					"GET /api/manual-payments/orders — Órdenes del usuario.",
					"POST /api/manual-payments/orders — Crea una orden.",
					"GET /api/manual-payments/admin/orders — Órdenes por revisar (admin).",
					"PUT /api/manual-payments/admin/orders/:id/review — Aprueba o rechaza (admin).",
					"",
					"Novedades:",
					"GET /api/updates — Actualizaciones publicadas (público).",
					"GET /api/updates/:id — Detalle de una novedad (público).",
					"POST /api/updates — Crea una novedad.",
					"PUT /api/updates/:id — Actualiza una novedad.",
					"DELETE /api/updates/:id — Elimina una novedad.",
					"POST /api/updates/generate — Redacta la novedad con IA (descuenta créditos).",
					"",
					"Descubre (comunidad):",
					"GET /api/descubre/posts — Publicaciones; se puede leer sin sesión.",
					"POST /api/descubre/posts — Publica.",
					"PUT /api/descubre/posts/:id — Edita la publicación propia.",
					"DELETE /api/descubre/posts/:id — Elimina la publicación propia.",
					"POST /api/descubre/posts/:id/vote — Vota o quita el voto.",
					"GET /api/descubre/admin/posts — Todas las publicaciones (admin).",
					"DELETE /api/descubre/admin/posts/:id — Borra cualquier publicación (admin).",
					"",
					"Estado y avisos:",
					"GET /api/stats/daily — Estadísticas del día (público).",
					"GET /api/status — Estado del servicio (público, API heredada).",
					"GET /api/user-count — Número de usuarios (público).",
					"GET /api/members/status — Estado del módulo de miembros (público).",
					"POST /api/notifications/daily-report — Envía el reporte diario (lo llama la tarea programada).",
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
						<Link to="/">Volver</Link>
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
						<div className="space-y-1.5">
							{activeItem.content.map((line, idx) => {
								const key = `${activeItem.id}-${idx}`;
								if (!line) return <div key={key} className="h-2" />;

								const endpoint = /^(GET|POST|PUT|PATCH|DELETE)\s/.exec(
									line,
								);
								if (endpoint) {
									const verb = endpoint[1];
									const afterVerb = line.slice(verb.length).trim();
									const cut = afterVerb.search(/\s+[—–]\s+/);
									const path = cut > -1 ? afterVerb.slice(0, cut) : afterVerb;
									const summary = cut > -1 ? afterVerb.slice(cut + 1) : "";
									const docs = findApiDocs(verb, path);

									return (
										<div key={key} className="space-y-1 pt-1">
											<p className="flex gap-2 rounded-md bg-muted/50 px-2 py-1 font-mono text-[12.5px] leading-5">
												<span
													className={`w-12 shrink-0 font-semibold ${VERB_COLOR[verb]}`}
												>
													{verb}
												</span>
												<span className="text-foreground/90">{path}</span>
											</p>
											{summary && (
												<p className="pl-2 text-sm leading-6 text-muted-foreground">
													{summary}
												</p>
											)}
											<ApiParams docs={docs} />
										</div>
									);
								}

								if (line.endsWith(":")) {
									return (
										<p
											key={key}
											className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
										>
											{line}
										</p>
									);
								}

								return (
									<p key={key} className="text-sm leading-6">
										{line}
									</p>
								);
							})}
						</div>

							<Separator className="my-6" />

							{activeCategory === "api" && (
								<p className="mb-6 text-xs leading-5 text-muted-foreground">
									Los parámetros de cada endpoint se extraen del código del
									servidor ({API_DOCS_STATS.endpoints} rutas montadas,{" "}
									{API_DOCS_STATS.conParametros} con parámetros,
									{API_DOCS_STATS.totalParametros} en total) y se regeneran
									con <code>node server/scripts/extract-api-params.js</code>. Un
									parámetro aparece como obligatorio solo si el servidor lo
									comprueba y responde 400/422, o si el esquema lo declara sin{" "}
									<code>.optional()</code>; el contrato definitivo es el
									servidor. Los parámetros de la ruta se marcan siempre como
									obligatorios.
								</p>
							)}

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
