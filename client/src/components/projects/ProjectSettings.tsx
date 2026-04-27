import {
	Bell,
	GitBranch,
	MessageSquare,
	Palette,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import TaskConfigManager from "@/components/projects/task-management/TaskConfigManager";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useProjectContext } from "./ProjectProvider";
import api from "@/lib/api";
import { useState } from "react";

interface ProjectSettingsProps {
	projectId: string;
}

const ProjectSettings: FC<ProjectSettingsProps> = ({ projectId }) => {
	const { project } = useProjectContext();
	const navigate = useNavigate();
	const [isCreatingChat, setIsCreatingChat] = useState(false);

	const handleCreateChat = async () => {
		setIsCreatingChat(true);
		try {
			const response = await api.post(
				`/api/projects/${projectId}/create-conversation`
			);
			if (response.data.conversation_id) {
				navigate(`/chat?conversation=${response.data.conversation_id}`);
			}
		} catch (error) {
			console.error("Error creating chat:", error);
		} finally {
			setIsCreatingChat(false);
		}
	};

	const handleGoToChat = () => {
		if (project?.conversation_id) {
			navigate(`/chat?conversation=${project.conversation_id}`);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Settings className="w-6 h-6" />
				<h1 className="text-2xl font-bold">Configuración del Proyecto</h1>
			</div>

			{/* Chat del Proyecto */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessageSquare className="w-5 h-5" />
						Chat del Proyecto
					</CardTitle>
					<CardDescription>
						Comunicación entre los miembros del equipo
					</CardDescription>
				</CardHeader>
				<CardContent>
					{project?.conversation_id ? (
						<div className="flex items-center justify-between">
							<p className="text-sm text-gray-600">
								Conversación creada exitosamente
							</p>
							<Button onClick={handleGoToChat}>
								<MessageSquare className="w-4 h-4 mr-2" />
								Ir al Chat
							</Button>
						</div>
					) : (
						<div className="flex items-center justify-between">
							<p className="text-sm text-gray-600">
								Crea una conversación para facilitar la comunicación entre
								los miembros del proyecto
							</p>
							<Button
								onClick={handleCreateChat}
								disabled={isCreatingChat}
							>
								{isCreatingChat ? "Creando..." : "Crear Chat"}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

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
