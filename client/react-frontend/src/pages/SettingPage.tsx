// src/pages/SettingsPage.tsx
import { FC, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Bell,
	ChevronDown,
	Copy,
	Eye,
	EyeOff,
	Globe,
	KeyRound,
	Loader2,
	Menu,
	Palette,
	Shield,
	Trash2,
	Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/theme-context";
import { useUsers } from "@/hooks/connection/useUsers";
import { useWeb3 } from "@/components/billing/hooks/useWeb3";
import { toast } from "sonner";
import api from "@/lib/api";

type Theme = "classic" | "red" | "green" | "fire" | "purple" | "pink";

const usdtAddress = "0xbf1d573d4ce347b7ba0f198028cca36df7aeaf9b";
const paymentGatewayAddress = "0x484cad0b7237dfda563f976ce54a53af1b515a5c";

const themes = [
	{ id: "classic", name: "Clásico", colors: ["#3b82f6", "#1e40af"] },
	{ id: "red", name: "Rojo", colors: ["#ef4444", "#dc2626"] },
	{ id: "green", name: "Verde", colors: ["#10b981", "#059669"] },
	{ id: "fire", name: "Fuego", colors: ["#f59e0b", "#d97706"] },
	{ id: "purple", name: "Púrpura", colors: ["#8b5cf6", "#7c3aed"] },
	{ id: "pink", name: "Rosa", colors: ["#ec4899", "#db2777"] },

	{ id: "emerald", name: "Esmeralda", colors: ["#10b981", "#059669"] },
	{ id: "amber", name: "Ámbar", colors: ["#f59e0b", "#d97706"] },
	{ id: "violet", name: "Violeta", colors: ["#8b5cf6", "#7c3aed"] },
	{ id: "teal", name: "Turquesa", colors: ["#14b8a6", "#0d9488"] },
	{ id: "cyan", name: "Cian", colors: ["#06b6d4", "#0891b2"] },
];

interface Token {
	id: string;
	token_type: string;
	created_at: string;
	updated_at: string;
}

const TOKEN_LABELS: Record<string, string> = {
	github: "GitHub",
	gemini: "Gemini AI",
	openrouter: "OpenRouter",
	replicate: "Replicate",
};

const TokensSection: FC = () => {
	const [tokens, setTokens] = useState<Token[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [tokenType, setTokenType] = useState("github");
	const [tokenValue, setTokenValue] = useState("");
	const [externalToken, setExternalToken] = useState("");
	const [externalTokenLoading, setExternalTokenLoading] = useState(false);
	const [showExternalToken, setShowExternalToken] = useState(false);

	useEffect(() => {
		fetchTokens();
	}, []);

	const fetchTokens = async () => {
		try {
			const response = await api.get("/api/tokens");
			setTokens(response.data);
		} catch (error) {
			toast.error("Error al cargar los tokens");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSaveToken = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!tokenValue.trim()) return;

		setIsSaving(true);
		try {
			await api.post("/api/tokens", { token: tokenValue, tokenType });
			toast.success("Token guardado correctamente");
			setTokenValue("");
			fetchTokens();
		} catch (error) {
			toast.error("Error al guardar el token");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteToken = async (id: string) => {
		if (!confirm("¿Estás seguro de eliminar este token?")) return;
		try {
			await api.delete(`/api/tokens/${id}`);
			toast.success("Token eliminado");
			fetchTokens();
		} catch (error) {
			toast.error("Error al eliminar");
		}
	};

	const handleGenerateExternalToken = async () => {
		setExternalTokenLoading(true);
		try {
			const response = await api.post<{ token: string }>(
				"/api/auth/external-token",
			);
			setExternalToken(response.data.token);
			setShowExternalToken(true);
			toast.success("Token externo generado. Puedes copiarlo.");
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || "Error al generar el token externo",
			);
		} finally {
			setExternalTokenLoading(false);
		}
	};

	const handleCopyExternalToken = async () => {
		if (!externalToken) return;
		try {
			await navigator.clipboard.writeText(externalToken);
			toast.success("Token copiado al portapapeles");
		} catch (error) {
			toast.error("No se pudo copiar el token");
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center py-8">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Tokens de Integración</h3>
				<p className="text-sm text-muted-foreground">
					Gestiona tus claves API externas
				</p>
			</div>

			<form onSubmit={handleSaveToken} className="space-y-4">
				<div className="grid gap-4">
					<div className="space-y-2">
						<Label>Tipo de Token</Label>
						<Select value={tokenType} onValueChange={setTokenType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="github">GitHub</SelectItem>
								<SelectItem value="gemini">Gemini AI</SelectItem>
								<SelectItem value="openrouter">OpenRouter</SelectItem>
								<SelectItem value="replicate">Replicate</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Token</Label>
						<div className="flex gap-2">
							<Input
								type="password"
								placeholder="pega tu token aquí"
								value={tokenValue}
								onChange={(e) => setTokenValue(e.target.value)}
							/>
							<Button type="submit" disabled={isSaving || !tokenValue.trim()}>
								{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								Guardar
							</Button>
						</div>
					</div>
				</div>
			</form>

			<div className="space-y-4 rounded-lg border p-4">
				<div>
					<h4 className="font-medium">Token para Apps Externas</h4>
					<p className="text-sm text-muted-foreground">
						Genera un token para autenticarte desde móvil, escritorio u otros
						sistemas.
					</p>
				</div>
				<div className="space-y-2">
					<Label>Token de acceso</Label>
					<div className="relative">
						<Input
							type={showExternalToken ? "text" : "password"}
							value={externalToken}
							readOnly
							placeholder="Genera un token para copiarlo aquí"
							className="pr-20"
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="absolute right-9 top-0 h-full px-2"
							onClick={() => setShowExternalToken(!showExternalToken)}
							disabled={!externalToken}
						>
							{showExternalToken ? (
								<EyeOff className="w-4 h-4" />
							) : (
								<Eye className="w-4 h-4" />
							)}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="absolute right-0 top-0 h-full px-3"
							onClick={handleCopyExternalToken}
							disabled={!externalToken}
						>
							<Copy className="w-4 h-4" />
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						Úsalo si te autenticas con Google en la web y necesitas acceso en
						el teléfono.
					</p>
				</div>
				<Button
					type="button"
					onClick={handleGenerateExternalToken}
					disabled={externalTokenLoading}
					className="w-full"
				>
					{externalTokenLoading ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Generando...
						</>
					) : (
						"Generar token externo"
					)}
				</Button>
			</div>

			<div>
				<h4 className="font-medium mb-3">Tokens guardados</h4>
				{tokens.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-4">
						No hay tokens configurados
					</p>
				) : (
					<div className="space-y-2">
						{tokens.map((token) => (
							<div
								key={token.id}
								className="flex items-center justify-between p-3 border rounded-lg"
							>
								<div>
									<p className="font-medium">{TOKEN_LABELS[token.token_type] || token.token_type}</p>
									<p className="text-xs text-muted-foreground">
										Creado:{" "}
										{new Date(token.created_at).toLocaleDateString("es-ES")}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleDeleteToken(token.id)}
								>
									<Trash2 className="w-4 h-4 text-destructive" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

const SettingsPage: FC = () => {
	const navigate = useNavigate();
	const [activeCategory, setActiveCategory] = useState("appearance");
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const { theme, setTheme, isDark, setIsDark } = useTheme();
	const { toggleUserPublic } = useUsers();

	const { address, isConnected, usdtBalance, connect, disconnect, chainId } =
		useWeb3(usdtAddress, paymentGatewayAddress);

	const networkName =
		chainId === 11155111
			? "Sepolia"
			: chainId === 1
				? "Ethereum"
				: "Desconocida";

	const categories = [
		{ id: "appearance", label: "Apariencia", icon: Palette },
		{ id: "notifications", label: "Notificaciones", icon: Bell },
		{ id: "privacy", label: "Privacidad", icon: Shield },
		{ id: "general", label: "General", icon: Globe },
		{ id: "tokens", label: "Tokens API", icon: KeyRound },
	];

	// === Render functions (iguales que en el modal original) ===
	const renderAppearanceSettings = () => (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">Tema de Color</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					{themes.map((t) => (
						<button
							key={t.id}
							onClick={() => setTheme(t.id as Theme)}
							className={`
                relative p-4 rounded-lg border-2 transition-all hover:scale-105
                ${theme === t.id ? "border-primary ring-2 ring-primary/20" : "border-border"}
              `}
						>
							<div className="flex gap-2 mb-2">
								<div
									className="w-5 h-5 rounded"
									style={{ backgroundColor: t.colors[0] }}
								/>
								<div
									className="w-5 h-5 rounded"
									style={{ backgroundColor: t.colors[1] }}
								/>
							</div>
							<span className="text-sm font-medium">{t.name}</span>
							{theme === t.id && (
								<Badge className="absolute -top-2 -right-2">Activo</Badge>
							)}
						</button>
					))}
				</div>
			</div>
			<Separator />
			<div>
				<h3 className="text-lg font-semibold mb-4">Modo Oscuro</h3>
				<div className="flex items-center justify-between p-4 border rounded-lg">
					<div>
						<p className="font-medium">Modo {isDark ? "Oscuro" : "Claro"}</p>
						<p className="text-sm text-muted-foreground">
							{isDark
								? "Mejor para visión nocturna"
								: "Mejor para entornos luminosos"}
						</p>
					</div>
					<Switch checked={isDark} onCheckedChange={setIsDark} />
				</div>
			</div>
		</div>
	);

	// ... (las demás funciones render: notifications, privacy, general → copiar tal cual del modal)

	const renderNotificationSettings = () => (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">Notificaciones Push</h3>
				<div className="space-y-4">
					{[
						{
							Label: "Nuevas tareas asignadas",
							desc: "Recibir notificación cuando te asignen una tarea",
						},
						{
							Label: "Cambios en subtareas",
							desc: "Notificar cuando cambien estados de subtareas",
						},
						{
							Label: "Menciones en comentarios",
							desc: "Cuando alguien te mencione en un comentario",
						},
						{
							Label: "Recordatorios de vencimiento",
							desc: "Alertas antes de que venzan las tareas",
						},
					].map((item, index) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={index}
							className="flex items-center justify-between p-3 border rounded-lg"
						>
							<div>
								<p className="font-medium">{item.Label}</p>
								<p className="text-sm text-gray-500">{item.desc}</p>
							</div>
							<Switch defaultChecked={index < 2} />
						</div>
					))}
				</div>
			</div>

			<Separator />

			<div>
				<h3 className="text-lg font-semibold mb-4">Configuración de Sonido</h3>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<span>Sonidos de notificación</span>
						<Switch defaultChecked />
					</div>
					<div>
						<Label className="block text-sm font-medium mb-2">Volumen</Label>
						<Slider defaultValue={[70]} max={100} min={0} step={10} />
					</div>
					<div>
						<Label className="block text-sm font-medium mb-2">
							Tono de notificación
						</Label>
						<Select defaultValue="default">
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="default">Por defecto</SelectItem>
								<SelectItem value="chime">Campanilla</SelectItem>
								<SelectItem value="ping">Ping</SelectItem>
								<SelectItem value="notification">Notificación</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		</div>
	);

	const renderPrivacySettings = () => (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">Visibilidad del Perfil</h3>
				<div className="space-y-4">
					{[
						{
							id: "public-profile",
							Label: "Establecer como usuario público",
							desc: "Otros usuarios pueden ver y encontrar tu perfil",
						},
						{
							id: "online-status",
							Label: "Mostrar estado en línea",
							desc: "Otros usuarios pueden ver cuando estás activo",
						},
						{
							id: "last-seen",
							Label: "Mostrar última actividad",
							desc: "Mostrar cuándo fue tu última actividad",
						},
						{
							id: "mentions",
							Label: "Permitir menciones",
							desc: "Otros pueden mencionarte en comentarios",
						},
					].map((item, index) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={index}
							className="flex items-center justify-between p-3 border rounded-lg"
						>
							<div>
								<p className="font-medium">{item.Label}</p>
								<p className="text-sm text-gray-500">{item.desc}</p>
							</div>
							<Switch
								id={item.id}
								// funcion para hacer publico o privado el usuario
								onCheckedChange={(checked) => {
									if (item.id === "public-profile") {
										toggleUserPublic(checked as boolean);
									}
								}}
								defaultChecked={index !== 1}
							/>
						</div>
					))}
				</div>
			</div>

			<Separator />

			<div>
				<h3 className="text-lg font-semibold mb-4">Datos y Privacidad</h3>
				<div className="space-y-3">
					<Button
						variant="outline"
						className="w-full justify-start bg-transparent"
					>
						Descargar mis datos
					</Button>
					<Button
						variant="outline"
						className="w-full justify-start bg-transparent"
					>
						Eliminar historial de actividad
					</Button>
					<Button variant="destructive" className="w-full justify-start">
						Eliminar cuenta
					</Button>
				</div>
			</div>
		</div>
	);

	const renderGeneralSettings = () => (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">Idioma y Región</h3>
				<div className="space-y-4">
					<div>
						<Label className="block text-sm font-medium mb-2">Idioma</Label>
						<Select defaultValue="es">
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="es">Español</SelectItem>
								<SelectItem value="en">English</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label className="block text-sm font-medium mb-2">
							Zona horaria
						</Label>
						<Select defaultValue="america/havana">
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="america/havana">
									América/La Habana
								</SelectItem>
								<SelectItem value="america/new_york">
									América/Nueva York
								</SelectItem>
								<SelectItem value="europe/madrid">Europa/Madrid</SelectItem>
								<SelectItem value="america/mexico_city">
									América/Ciudad de México
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<Separator />

			<div>
				<h3 className="text-lg font-semibold mb-4">Configuración de Trabajo</h3>
				<div className="space-y-4">
					<div>
						<Label className="block text-sm font-medium mb-2">
							Horas de trabajo por día
						</Label>
						<Slider defaultValue={[8]} max={12} min={4} step={1} />
						<div className="flex justify-between text-sm text-gray-500 mt-1">
							<span>4h</span>
							<span>8h</span>
							<span>12h</span>
						</div>
					</div>
					<div className="flex items-center justify-between p-3 border rounded-lg">
						<div>
							<p className="font-medium">Modo concentración</p>
							<p className="text-sm text-gray-500">
								Silenciar notificaciones durante trabajo
							</p>
						</div>
						<Switch />
					</div>
				</div>
			</div>
		</div>
	);

	const renderCategoryContent = () => {
		switch (activeCategory) {
			case "appearance":
				return renderAppearanceSettings();
			case "notifications":
				return renderNotificationSettings();
			case "privacy":
				return renderPrivacySettings();
			case "general":
				return renderGeneralSettings();
			case "tokens":
				return <TokensSection />;
			default:
				return renderAppearanceSettings();
		}
	};

	return (
		<div className="flex h-screen bg-background">
			{/* Topbar */}
			<header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
				<div className="flex items-center justify-between px-4 h-full">
					<div className="flex items-center gap-2 md:gap-4">
						<Button
							variant="outline"
							size="sm"
							onClick={() => navigate(-1)}
							className="gap-1"
						>
							<ArrowLeft className="h-4 w-4" />
							<span className="hidden sm:inline">Volver</span>
						</Button>
						<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" className="md:hidden">
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent side="left" className="w-64 p-0">
								<div className="p-4 space-y-4">
									<h2 className="text-lg font-semibold">Configuración</h2>
									{categories.map((cat) => {
										const Icon = cat.icon;
										return (
											<Button
												key={cat.id}
												variant={
													activeCategory === cat.id ? "secondary" : "ghost"
												}
												className="w-full justify-start"
												onClick={() => {
													setActiveCategory(cat.id);
													setMobileMenuOpen(false);
												}}
											>
												<Icon className="w-4 h-4 mr-2" />
												{cat.label}
											</Button>
										);
									})}
								</div>
							</SheetContent>
						</Sheet>
						<h1 className="text-lg font-semibold">Configuración</h1>
					</div>

					{/* Wallet status (igual que en Billing) */}
					<div className="flex items-center gap-3">
						{!isConnected ? (
							<Button size="sm" onClick={connect}>
								<Wallet className="w-4 h-4 mr-2" />
								Conectar Wallet
							</Button>
						) : (
							<>
								<div className="hidden sm:block text-right">
									<div className="text-xs text-muted-foreground">
										Balance USDT
									</div>
									<div className="font-medium">${usdtBalance}</div>
								</div>
								<div className="text-right">
									<Badge variant="secondary" className="text-xs">
										{networkName}
									</Badge>
									<Button
										variant="outline"
										size="sm"
										onClick={disconnect}
										className="block mt-1"
									>
										{address?.slice(0, 6)}...{address?.slice(-4)}
									</Button>
								</div>
							</>
						)}
					</div>
				</div>
			</header>

			{/* Main content */}
			<div className="flex flex-1 pt-16">
				{/* Desktop Sidebar */}
				<aside className="hidden md:block w-64 border-r border-border bg-muted/40 p-4 overflow-y-auto">
					<div className="space-y-1">
						{categories.map((cat) => {
							const Icon = cat.icon;
							return (
								<Button
									key={cat.id}
									variant={activeCategory === cat.id ? "secondary" : "ghost"}
									className="w-full justify-start"
									onClick={() => setActiveCategory(cat.id)}
								>
									<Icon className="w-4 h-4 mr-2" />
									{cat.label}
								</Button>
							);
						})}
					</div>
				</aside>

				{/* Content Area */}
				<main className="flex-1 overflow-y-auto p-6 md:p-8">
					<div className="max-w-4xl mx-auto">
						{/* Desktop: contenido directo */}
						<div className="hidden md:block">{renderCategoryContent()}</div>

						{/* Mobile: acordeones */}
						<div className="md:hidden space-y-4">
							{categories.map((cat) => {
								const Icon = cat.icon;
								const isOpen = activeCategory === cat.id;
								return (
									<Collapsible
										key={cat.id}
										open={isOpen}
										onOpenChange={() => setActiveCategory(cat.id)}
									>
										<CollapsibleTrigger className="flex w-full items-center justify-between p-4 border rounded-lg hover:bg-muted">
											<div className="flex items-center gap-3">
												<Icon className="w-5 h-5" />
												<span className="font-medium">{cat.label}</span>
											</div>
											<ChevronDown
												className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
											/>
										</CollapsibleTrigger>
										<CollapsibleContent className="mt-2 border rounded-lg p-4 bg-muted/30">
											{activeCategory === cat.id && renderCategoryContent()}
										</CollapsibleContent>
									</Collapsible>
								);
							})}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default SettingsPage;
