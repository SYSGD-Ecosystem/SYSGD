"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Bell,
	X,
	UserPlus,
	MessageSquare,
	FileText,
	Calendar,
	Target,
} from "lucide-react";

interface Notification {
	id: number;
	tipo:
		| "asignacion"
		| "mencion"
		| "invitacion"
		| "archivo"
		| "evento"
		| "comentario";
	titulo: string;
	mensaje: string;
	usuario: string;
	tiempo: string;
	leida: boolean;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	icono: any;
	color: string;
}

interface NotificationsPopupProps {
	isOpen: boolean;
	onClose: () => void;
}

export function NotificationsPopup({
	isOpen,
	onClose,
}: NotificationsPopupProps) {
	const [notifications, setNotifications] = useState<Notification[]>([
		{
			id: 1,
			tipo: "asignacion",
			titulo: "Nueva tarea asignada",
			mensaje:
				"Lazaro te asignó la tarea 'Implementar sistema de autenticación' en el proyecto SYSGD",
			usuario: "Lazaro Yunier",
			tiempo: "Hace 5 minutos",
			leida: false,
			icono: Target,
			color: "text-blue-600",
		},
		{
			id: 2,
			tipo: "mencion",
			titulo: "Te mencionaron en un comentario",
			mensaje:
				"Carlos te mencionó en la tarea 'Diseño de base de datos': '@yamila ¿podrías revisar el esquema?'",
			usuario: "Carlos Rodríguez",
			tiempo: "Hace 15 minutos",
			leida: false,
			icono: MessageSquare,
			color: "text-green-600",
		},
		{
			id: 3,
			tipo: "invitacion",
			titulo: "Invitación a proyecto",
			mensaje:
				"María Elena te invitó a unirte al proyecto 'Dashboard Analytics' como Desarrollador Frontend",
			usuario: "María Elena",
			tiempo: "Hace 30 minutos",
			leida: false,
			icono: UserPlus,
			color: "text-purple-600",
		},
		{
			id: 4,
			tipo: "archivo",
			titulo: "Archivo compartido",
			mensaje:
				"Yamila compartió el archivo 'Registro de Entrada - Julio 2025.pdf' contigo",
			usuario: "Yamila García",
			tiempo: "Hace 1 hora",
			leida: true,
			icono: FileText,
			color: "text-orange-600",
		},
		{
			id: 5,
			tipo: "evento",
			titulo: "Recordatorio de evento",
			mensaje: "La reunión 'Planificación Sprint' comenzará en 30 minutos",
			usuario: "Sistema",
			tiempo: "Hace 2 horas",
			leida: true,
			icono: Calendar,
			color: "text-red-600",
		},
		{
			id: 6,
			tipo: "comentario",
			titulo: "Nuevo comentario",
			mensaje:
				"Ana comentó en tu tarea 'Revisión de código': 'Excelente trabajo, solo algunos ajustes menores'",
			usuario: "Ana Martínez",
			tiempo: "Hace 3 horas",
			leida: true,
			icono: MessageSquare,
			color: "text-indigo-600",
		},
	]);

	const markAsRead = (id: number) => {
		setNotifications(
			notifications.map((notif) =>
				notif.id === id ? { ...notif, leida: true } : notif,
			),
		);
	};

	const markAllAsRead = () => {
		setNotifications(notifications.map((notif) => ({ ...notif, leida: true })));
	};

	const deleteNotification = (id: number) => {
		setNotifications(notifications.filter((notif) => notif.id !== id));
	};

	const unreadCount = notifications.filter((n) => !n.leida).length;

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-end p-4">
			{/* Overlay */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div className="fixed inset-0 bg-black bg-opacity-20" onClick={onClose} />

			{/* Popup */}
			<Card className="relative w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
				<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-2">
						<Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
						<h3 className="font-semibold text-gray-900 dark:text-white">
							Notificaciones
						</h3>
						{unreadCount > 0 && (
							<Badge variant="destructive" className="text-xs">
								{unreadCount}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2">
						{unreadCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={markAllAsRead}
								className="text-xs"
							>
								Marcar todas
							</Button>
						)}
						<Button variant="ghost" size="sm" onClick={onClose}>
							<X className="w-4 h-4" />
						</Button>
					</div>
				</div>

				<ScrollArea className="h-96">
					<div className="p-2">
						{notifications.length === 0 ? (
							<div className="text-center py-8">
								<Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
								<p className="text-gray-500 dark:text-gray-400">
									No tienes notificaciones
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{notifications.map((notification) => {
									const Icon = notification.icono;
									return (
										// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
										<div
											key={notification.id}
											className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
												!notification.leida
													? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
													: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
											}`}
											onClick={() => markAsRead(notification.id)}
										>
											<div className="flex items-start gap-3">
												<div
													// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
													className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0`}
												>
													<Icon className={`w-4 h-4 ${notification.color}`} />
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between">
														<h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
															{notification.titulo}
														</h4>
														<Button
															variant="ghost"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																deleteNotification(notification.id);
															}}
															className="ml-2 p-1 h-6 w-6"
														>
															<X className="w-3 h-3" />
														</Button>
													</div>
													<p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
														{notification.mensaje}
													</p>
													<div className="flex items-center justify-between mt-2">
														<span className="text-xs text-gray-500 dark:text-gray-400">
															{notification.usuario}
														</span>
														<span className="text-xs text-gray-500 dark:text-gray-400">
															{notification.tiempo}
														</span>
													</div>
												</div>
												{!notification.leida && (
													<div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</ScrollArea>

				<div className="p-4 border-t border-gray-200 dark:border-gray-700">
					<Button variant="outline" className="w-full bg-transparent" size="sm">
						Ver todas las notificaciones
					</Button>
				</div>
			</Card>
		</div>
	);
}
