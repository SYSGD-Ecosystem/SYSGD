import {
	Bell,
	GitBranch,
	Palette,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import type { FC } from "react";
import TaskConfigManager from "@/components/projects/task-management/TaskConfigManager";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ProjectSettingsProps {
	projectId: string;
}

const ProjectSettings: FC<ProjectSettingsProps> = ({ projectId }) => {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Settings className="w-6 h-6" />
				<h1 className="text-2xl font-bold">Configuración del Proyecto</h1>
			</div>

			{/* Task Configuration */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<GitBranch className="w-5 h-5" />
						Configuración de Tareas
					</CardTitle>
					<CardDescription>
						Define los tipos, estados y prioridades para las tareas de este
						proyecto
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TaskConfigManager projectId={projectId} />
				</CardContent>
			</Card>

			<Separator />

			{/* Future Configuration Sections */}
			<div className="space-y-4 hidden">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Palette className="w-5 h-5" />
							Apariencia
						</CardTitle>
						<CardDescription>
							Personaliza el aspecto visual del proyecto
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-500">
							Próximamente: Temas, colores personalizados y más...
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="w-5 h-5" />
							Permisos y Roles
						</CardTitle>
						<CardDescription>
							Gestiona los permisos de los miembros del equipo
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-500">
							Próximamente: Roles personalizados y permisos granulares...
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bell className="w-5 h-5" />
							Notificaciones
						</CardTitle>
						<CardDescription>
							Configura las alertas y notificaciones del proyecto
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-500">
							Próximamente: Notificaciones por email, push y más...
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="w-5 h-5" />
							Seguridad
						</CardTitle>
						<CardDescription>
							Ajustes de seguridad y privacidad del proyecto
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-500">
							Próximamente: Autenticación de dos factores, auditoría y más...
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default ProjectSettings;
