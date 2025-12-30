"use client";

import { Calendar, GripVertical, Plus, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KanbanTask {
	id: number;
	titulo: string;
	descripcion: string;
	prioridad: string;
	asignado: string;
	fecha: string;
	tipo: string;
	estado: string;
}

export function KanbanBoard() {
	const [tasks, setTasks] = useState<KanbanTask[]>([
		{
			id: 1,
			titulo: "Diseñar base de datos",
			descripcion: "Crear el esquema de la base de datos para el sistema",
			prioridad: "Alta",
			asignado: "Lazaro",
			fecha: "10/07/2025",
			tipo: "Tarea",
			estado: "Pendiente",
		},
		{
			id: 2,
			titulo: "Investigar nuevas tecnologías",
			descripcion: "Evaluar frameworks modernos para el frontend",
			prioridad: "Media",
			asignado: "Yamila",
			fecha: "12/07/2025",
			tipo: "Idea",
			estado: "Pendiente",
		},
		{
			id: 3,
			titulo: "Implementar autenticación",
			descripcion: "Desarrollar el sistema de login y registro",
			prioridad: "Alta",
			asignado: "Lazaro",
			fecha: "08/07/2025",
			tipo: "Tarea",
			estado: "En Progreso",
		},
		{
			id: 4,
			titulo: "Crear componentes UI",
			descripcion: "Desarrollar los componentes reutilizables",
			prioridad: "Media",
			asignado: "Equipo",
			fecha: "09/07/2025",
			tipo: "Tarea",
			estado: "En Progreso",
		},
		{
			id: 5,
			titulo: "Configurar proyecto",
			descripcion: "Inicializar el proyecto con Next.js",
			prioridad: "Alta",
			asignado: "Lazaro",
			fecha: "05/07/2025",
			tipo: "Tarea",
			estado: "Completado",
		},
	]);

	const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);

	const handleDragStart = (e: React.DragEvent, task: KanbanTask) => {
		setDraggedTask(task);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (e: React.DragEvent, newStatus: string) => {
		e.preventDefault();
		if (draggedTask && draggedTask.estado !== newStatus) {
			setTasks(
				tasks.map((task) =>
					task.id === draggedTask.id ? { ...task, estado: newStatus } : task,
				),
			);
		}
		setDraggedTask(null);
	};

	const getTasksByStatus = (status: string) => {
		return tasks.filter((task) => task.estado === status);
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "Alta":
				return "destructive";
			case "Media":
				return "default";
			case "Baja":
				return "secondary";
			default:
				return "default";
		}
	};

	const getColumnColor = (column: string) => {
		switch (column) {
			case "Pendiente":
				return "border-yellow-200 bg-yellow-50";
			case "En Progreso":
				return "border-blue-200 bg-blue-50";
			case "Completado":
				return "border-green-200 bg-green-50";
			default:
				return "border-gray-200 bg-gray-50";
		}
	};

	return (
		<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
			<div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
				<div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
							TABLERO KANBAN
						</h1>
						<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
							VISUALIZACIÓN DE TAREAS POR ESTADO
						</h2>
					</div>
					<div className="text-right">
						<div className="text-sm font-medium text-gray-600 dark:text-gray-400">
							KB1
						</div>
					</div>
				</div>
			</div>

			<div className="p-4 md:p-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
					{["Pendiente", "En Progreso", "Completado"].map((column) => (
						<div
							key={column}
							className={`rounded-lg border-2 ${getColumnColor(column)} dark:border-gray-600 p-4`}
							onDragOver={handleDragOver}
							onDrop={(e) => handleDrop(e, column)}
						>
							<div className="flex items-center justify-between mb-4">
								<h3 className="font-semibold text-gray-900 dark:text-white">
									{column}
								</h3>
								<Badge
									variant="outline"
									className="dark:border-gray-600 dark:text-gray-300"
								>
									{getTasksByStatus(column).length}
								</Badge>
							</div>

							<div className="space-y-3">
								{getTasksByStatus(column).map((task) => (
									<Card
										key={task.id}
										className="cursor-move hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
										draggable
										onDragStart={(e) => handleDragStart(e, task)}
									>
										<CardHeader className="pb-2">
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-2 flex-1 min-w-0">
													<GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
													<CardTitle className="text-sm font-medium text-gray-900 dark:text-white truncate">
														{task.titulo}
													</CardTitle>
												</div>
												<Badge
													variant={getPriorityColor(task.prioridad)}
													className="text-xs ml-2 flex-shrink-0"
												>
													{task.prioridad}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className="pt-0">
											<p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
												{task.descripcion}
											</p>
											<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
												<div className="flex items-center gap-1 truncate">
													<User className="w-3 h-3 flex-shrink-0" />
													<span className="truncate">{task.asignado}</span>
												</div>
												<div className="flex items-center gap-1 flex-shrink-0">
													<Calendar className="w-3 h-3" />
													{task.fecha}
												</div>
											</div>
										</CardContent>
									</Card>
								))}

								<Button
									variant="ghost"
									className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 h-20 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
								>
									<Plus className="w-4 h-4 mr-2" />
									Agregar tarea
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
