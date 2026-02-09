import {
	Bell,
	ChevronDown,
	Globe,
	KeyRound,
	Monitor,
	Palette,
	Shield,
	Smartphone,
} from "lucide-react";
import { type FC, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/theme-context";
import { useUsers } from "@/hooks/connection/useUsers";
import { Input } from '@/components/ui/input';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from "@/lib/api";

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

type Theme = "classic" | "red" | "green" | "fire" | "purple" | "pink";

const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose }) => {
	const [activeCategory, setActiveCategory] = useState("appearance");
	const { theme, setTheme, isDark, setIsDark } = useTheme();
	const { toggleUserPublic } = useUsers();

	const categories = [
		{ id: "appearance", Label: "Apariencia", icon: Palette },
		{ id: "notifications", Label: "Notificaciones", icon: Bell },
		{ id: "privacy", Label: "Privacidad", icon: Shield },
		{ id: "general", Label: "General", icon: Globe },
		{ id: "tokens", Label: "Tokens API", icon: KeyRound },
	];

	const themes = [
		{ id: "classic", name: "Clásico", colors: ["#3b82f6", "#1e40af"] },
		{ id: "red", name: "Rojo", colors: ["#ef4444", "#dc2626"] },
		{ id: "green", name: "Verde", colors: ["#10b981", "#059669"] },
		{ id: "fire", name: "Fuego", colors: ["#f59e0b", "#d97706"] },
		{ id: "purple", name: "Púrpura", colors: ["#8b5cf6", "#7c3aed"] },
		{ id: "pink", name: "Rosa", colors: ["#ec4899", "#db2777"] },
	];

	const renderAppearanceSettings = () => (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">Tema de Color</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					{themes.map((themeOption) => (
						<button
							type="button"
							key={themeOption.id}
							onClick={() => setTheme(themeOption.id as Theme)}
							className={`
                relative p-4 rounded-lg border-2 transition-all hover:scale-105
                ${
									theme === themeOption.id
										? "border-blue-500 ring-2 ring-blue-200"
										: "border-gray-200 dark:border-gray-700"
								}
              `}
						>
							<div className="flex items-center space-x-2 mb-2">
								<div
									className="w-4 h-4 rounded-full"
									style={{ backgroundColor: themeOption.colors[0] }}
								/>
								<div
									className="w-4 h-4 rounded-full"
									style={{ backgroundColor: themeOption.colors[1] }}
								/>
							</div>
							<span className="text-sm font-medium">{themeOption.name}</span>
							{theme === themeOption.id && (
								<Badge className="absolute -top-2 -right-2 bg-blue-500">
									Activo
								</Badge>
							)}
						</button>
					))}
				</div>
			</div>

			<Separator />

			<div>
				<h3 className="text-lg font-semibold mb-4">Modo de Visualización</h3>
				<div className="flex items-center justify-between p-4 border rounded-lg">
					<div className="flex items-center space-x-3">
						{isDark ? (
							<Monitor className="w-5 h-5" />
						) : (
							<Smartphone className="w-5 h-5" />
						)}
						<div>
							<p className="font-medium">Modo {isDark ? "Oscuro" : "Claro"}</p>
							<p className="text-sm text-gray-500">
								{isDark
									? "Interfaz oscura para mejor visualización nocturna"
									: "Interfaz clara para mejor visualización diurna"}
							</p>
						</div>
					</div>
					<Switch checked={isDark} onCheckedChange={setIsDark} />
				</div>
			</div>

			{/* <div>
				<h3 className="text-lg font-semibold mb-4">Tamaño de Fuente</h3>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span>Pequeño</span>
						<span>Grande</span>
					</div>
					<Slider
						defaultValue={[16]}
						max={24}
						min={12}
						step={2}
						className="w-full"
					/>
				</div>
			</div> */}
		</div>
	);

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
interface Token {
  id: string;
  token_type: string;
  created_at: string;
  updated_at: string;
}

const TokensSettings: FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tokenType, setTokenType] = useState('github');
  const [tokenValue, setTokenValue] = useState('');


  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await api.get('/api/tokens');
      const data = response.data;
      setTokens(data);
    } catch (error) {
      toast.error('Error al cargar los tokens');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenValue) return;

    setIsSaving(true);
    try {
      await api.post('/api/tokens', {
        token: tokenValue,
        tokenType
      });

      toast.success('Token guardado correctamente');
      setTokenValue('');
      fetchTokens();
    } catch (error) {
      toast.error('Error al guardar el token');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este token?')) return;

    try {
      await api.delete(`/api/tokens/${id}`);

      toast.success('Token eliminado correctamente');
      fetchTokens();
    } catch (error) {
      toast.error('Error al eliminar el token');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Administrar Tokens API</h3>
        <p className="text-sm text-muted-foreground">
          Gestiona tus tokens de integración con servicios externos
        </p>
      </div>

      <form onSubmit={handleSaveToken} className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="token-type">Tipo de Token</Label>
            <Select value={tokenType} onValueChange={setTokenType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo de token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="gemini">Gemini AI</SelectItem>
                <SelectItem value="replicate">Replicate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <div className="flex space-x-2">
              <Input
                id="token"
                type="password"
                placeholder="Ingresa tu token"
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!tokenValue || isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Guardar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              El token se almacenará de forma segura y encriptada
            </p>
          </div>
        </div>
      </form>

      <div className="mt-8">
        <h4 className="mb-4 font-medium">Tus Tokens</h4>
        {tokens.length === 0 ? (
          <div className="p-4 text-sm text-center text-muted-foreground">
            No hay tokens guardados
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium capitalize">{token.token_type}</p>
                  <p className="text-sm text-muted-foreground">
                    Creado: {new Date(token.created_at).toLocaleDateString()}
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
}

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
				return <TokensSettings />;
			default:
				return renderAppearanceSettings();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] p-0">
				<DialogHeader className="p-6 pb-0">
					<DialogTitle className="text-xl font-semibold">
						Configuración
					</DialogTitle>
				</DialogHeader>

				{/* Desktop Layout */}
				<div className="hidden border-t overflow-hidden md:flex h-[600px]">
					{/* Mini Sidebar */}
					<div className="w-64 border-r rounded-bl-lg bg-gray-50 dark:bg-gray-800/50 p-4">
						<div className="space-y-2">
							{categories.map((category) => {
								const Icon = category.icon;
								return (
									<button
										type="button"
										key={category.id}
										onClick={() => setActiveCategory(category.id)}
										className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${
												activeCategory === category.id
													? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
													: "hover:bg-gray-100 dark:hover:bg-gray-700"
											}
                    `}
									>
										<Icon className="w-5 h-5" />
										<span className="font-medium">{category.Label}</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Main Content */}
					<div className="flex-1 p-6 overflow-y-auto">
						{renderCategoryContent()}
					</div>
				</div>

				{/* Mobile Layout */}
				<div className="md:hidden p-4 max-h-[500px] overflow-y-auto">
					<div className="space-y-4">
						{categories.map((category) => {
							const Icon = category.icon;
							return (
								<Collapsible key={category.id}>
									<CollapsibleTrigger className="flex items-center justify-between w-full p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
										<div className="flex items-center space-x-3">
											<Icon className="w-5 h-5" />
											<span className="font-medium">{category.Label}</span>
										</div>
										<ChevronDown className="w-4 h-4" />
									</CollapsibleTrigger>
									<CollapsibleContent className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
										{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
										<div onClick={() => setActiveCategory(category.id)}>
											{category.id === "appearance" &&
												renderAppearanceSettings()}
											{category.id === "notifications" &&
												renderNotificationSettings()}
											{category.id === "privacy" && renderPrivacySettings()}
											{category.id === "general" && renderGeneralSettings()}
										</div>
									</CollapsibleContent>
								</Collapsible>
							);
						})}
					</div>
				</div>

				{/* Footer */}
				{/* <div className="border-t p-4 flex justify-between items-center">
					<p className="text-sm text-gray-500">
						SYSGD v2.1.0 - Ecosistema de Gestión Modular
					</p>
					<div className="flex space-x-2">
						<Button variant="outline" onClick={onClose}>
							Cancelar
						</Button>
						<Button onClick={onClose}>Guardar Cambios</Button>
					</div>
				</div> */}
			</DialogContent>
		</Dialog>
	);
};

export default SettingsModal;
