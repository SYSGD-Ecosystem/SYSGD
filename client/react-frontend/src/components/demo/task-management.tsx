"use client";

import {
	Calendar,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Filter,
	MoreHorizontal,
	Pause,
	Play,
	Plus,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface SubTask {
	id: number;
	titulo: string;
	estado:
		| "Pendiente"
		| "En Progreso"
		| "Completado"
		| "Cancelado"
		| "Suspendido";
	asignado: string;
}

interface Task {
	id: number;
	titulo: string;
	descripcion: string;
	tipo: string;
	prioridad: "Alta" | "Media" | "Baja";
	estado:
		| "Pendiente"
		| "En Progreso"
		| "Completado"
		| "Cancelado"
		| "Suspendido";
	fechaVencimiento: string;
	asignados: string[];
	subtareas: SubTask[];
	progreso: number;
}

export function TaskManagement() {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterUser, setFilterUser] = useState("all");
	const [filterType, setFilterType] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [expandedTasks, setExpandedTasks] = useState<number[]>([]);

	const [tasks, setTasks] = useState<Task[]>([
		{
			id: 1,
			titulo: "Implementar Sistema de Autenticación",
			descripcion:
				"Desarrollar sistema completo de login, registro y recuperación de contraseña con JWT",
			tipo: "Desarrollo",
			prioridad: "Alta",
			estado: "En Progreso",
			fechaVencimiento: "2025-01-30",
			asignados: ["Lazaro Yunier", "Ana García"],
			progreso: 65,
			subtareas: [
				{
					id: 1,
					titulo: "Diseñar base de datos de usuarios",
					estado: "Completado",
					asignado: "Lazaro Yunier",
				},
				{
					id: 2,
					titulo: "Implementar endpoints de API",
					estado: "En Progreso",
					asignado: "Lazaro Yunier",
				},
				{
					id: 3,
					titulo: "Crear interfaz de login",
					estado: "En Progreso",
					asignado: "Ana García",
				},
				{
					id: 4,
					titulo: "Implementar recuperación de contraseña",
					estado: "Pendiente",
					asignado: "Ana García",
				},
				{
					id: 5,
					titulo: "Testing y validación",
					estado: "Pendiente",
					asignado: "Lazaro Yunier",
				},
			],
		},
		{
			id: 2,
			titulo: "Diseño de Landing Page",
			descripcion:
				"Crear diseño moderno y responsive para la página principal del producto",
			tipo: "Diseño",
			prioridad: "Media",
			estado: "Completado",
			fechaVencimiento: "2025-01-25",
			asignados: ["María López"],
			progreso: 100,
			subtareas: [
				{
					id: 6,
					titulo: "Wireframes iniciales",
					estado: "Completado",
					asignado: "María López",
				},
				{
					id: 7,
					titulo: "Diseño visual",
					estado: "Completado",
					asignado: "María López",
				},
				{
					id: 8,
					titulo: "Prototipo interactivo",
					estado: "Completado",
					asignado: "María López",
				},
				{
					id: 9,
					titulo: "Revisión y ajustes",
					estado: "Completado",
					asignado: "María López",
				},
			],
		},
		{
			id: 3,
			titulo: "Optimización de Base de Datos",
			descripcion: "Mejorar rendimiento de consultas y optimizar índices",
			tipo: "Backend",
			prioridad: "Alta",
			estado: "Suspendido",
			fechaVencimiento: "2025-02-15",
			asignados: ["Carlos Ruiz"],
			progreso: 25,
			subtareas: [
				{
					id: 10,
					titulo: "Análisis de consultas lentas",
					estado: "Completado",
					asignado: "Carlos Ruiz",
				},
				{
					id: 11,
					titulo: "Crear índices optimizados",
					estado: "Suspendido",
					asignado: "Carlos Ruiz",
				},
				{
					id: 12,
					titulo: "Refactorizar consultas",
					estado: "Pendiente",
					asignado: "Carlos Ruiz",
				},
				{
					id: 13,
					titulo: "Testing de rendimiento",
					estado: "Pendiente",
					asignado: "Carlos Ruiz",
				},
			],
		},
	]);

	const users = ["Lazaro Yunier", "Ana García", "María López", "Carlos Ruiz"];
	const types = ["Desarrollo", "Diseño", "Backend", "Testing", "Documentación"];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Completado":
				return "bg-green-500";
			case "En Progreso":
				return "bg-blue-500";
			case "Pendiente":
				return "bg-yellow-500";
			case "Cancelado":
				return "bg-red-500";
			case "Suspendido":
				return "bg-gray-500";
			default:
				return "bg-gray-400";
		}
	};

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case "Completado":
				return "default";
			case "En Progreso":
				return "secondary";
			case "Pendiente":
				return "outline";
			case "Cancelado":
				return "destructive";
			case "Suspendido":
				return "secondary";
			default:
				return "outline";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "Alta":
				return "text-red-600 bg-red-50";
			case "Media":
				return "text-yellow-600 bg-yellow-50";
			case "Baja":
				return "text-green-600 bg-green-50";
			default:
				return "text-gray-600 bg-gray-50";
		}
	};

	const calculateProgress = (subtareas: SubTask[]) => {
		if (subtareas.length === 0) return 0;
		const completed = subtareas.filter(
			(st) => st.estado === "Completado",
		).length;
		return Math.round((completed / subtareas.length) * 100);
	};

	const updateSubtaskStatus = (
		taskId: number,
		subtaskId: number,
		newStatus: string,
	) => {
		setTasks((prevTasks) =>
			prevTasks.map((task) => {
				if (task.id === taskId) {
					const updatedSubtasks = task.subtareas.map((subtask) =>
						subtask.id === subtaskId
							? { ...subtask, estado: newStatus as SubTask["estado"] }
							: subtask,
					);
					const newProgress = calculateProgress(updatedSubtasks);
					return { ...task, subtareas: updatedSubtasks, progreso: newProgress };
				}
				return task;
			}),
		);
	};

	const updateTaskStatus = (taskId: number, newStatus: string) => {
		setTasks((prevTasks) =>
			prevTasks.map((task) =>
				task.id === taskId
					? { ...task, estado: newStatus as Task["estado"] }
					: task,
			),
		);
	};

	const toggleTaskExpansion = (taskId: number) => {
		setExpandedTasks((prev) =>
			prev.includes(taskId)
				? prev.filter((id) => id !== taskId)
				: [...prev, taskId],
		);
	};

	const filteredTasks = tasks.filter((task) => {
		const matchesSearch = task.titulo
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesUser =
			filterUser === "all" || task.asignados.includes(filterUser);
		const matchesType = filterType === "all" || task.tipo === filterType;
		const matchesStatus =
			filterStatus === "all" || task.estado === filterStatus;

		return matchesSearch && matchesUser && matchesType && matchesStatus;
	});

	const activeFiltersCount = [filterUser, filterType, filterStatus].filter(
		(f) => f !== "all",
	).length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Gestión de Tareas
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Sistema avanzado con subtareas anidadas y seguimiento de progreso
					</p>
				</div>
				<Button className="flex items-center space-x-2">
					<Plus className="w-4 h-4" />
					<span>Nueva Tarea</span>
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-col lg:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
					<Input
						placeholder="Buscar tareas..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>

				<div className="flex flex-wrap gap-2">
					<Select value={filterUser} onValueChange={setFilterUser}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Usuario" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos los usuarios</SelectItem>
							{users.map((user) => (
								<SelectItem key={user} value={user}>
									{user}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={filterType} onValueChange={setFilterType}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Tipo" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos los tipos</SelectItem>
							{types.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={filterStatus} onValueChange={setFilterStatus}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Estado" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos los estados</SelectItem>
							<SelectItem value="Pendiente">Pendiente</SelectItem>
							<SelectItem value="En Progreso">En Progreso</SelectItem>
							<SelectItem value="Completado">Completado</SelectItem>
							<SelectItem value="Cancelado">Cancelado</SelectItem>
							<SelectItem value="Suspendido">Suspendido</SelectItem>
						</SelectContent>
					</Select>

					{activeFiltersCount > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setFilterUser("all");
								setFilterType("all");
								setFilterStatus("all");
							}}
							className="flex items-center space-x-1"
						>
							<Filter className="w-4 h-4" />
							<span>Limpiar ({activeFiltersCount})</span>
						</Button>
					)}
				</div>
			</div>

			{/* Tasks Accordion */}
			<div className="space-y-4">
				{filteredTasks.map((task) => {
					const isExpanded = expandedTasks.includes(task.id);

					return (
						<Collapsible
							key={task.id}
							open={isExpanded}
							onOpenChange={() => toggleTaskExpansion(task.id)}
						>
							<div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
								{/* Task Header */}
								<CollapsibleTrigger className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4 flex-1">
											{/* Expand Icon */}
											{isExpanded ? (
												<ChevronDown className="w-5 h-5 text-gray-400" />
											) : (
												<ChevronRight className="w-5 h-5 text-gray-400" />
											)}

											{/* Task Info */}
											<div className="flex-1 min-w-0">
												<div className="flex items-center space-x-3 mb-2">
													<h3 className="font-semibold text-gray-900 dark:text-white truncate">
														{task.titulo}
													</h3>
													<Badge
														variant={getStatusBadgeVariant(task.estado)}
														className="shrink-0"
													>
														{task.estado}
													</Badge>
													<Badge
														className={`shrink-0 ${getPriorityColor(task.prioridad)}`}
													>
														{task.prioridad}
													</Badge>
												</div>

												<div className="flex items-center space-x-6 text-sm text-gray-500">
													{/* Users */}
													<div className="flex items-center space-x-1">
														<Users className="w-4 h-4" />
														<span>
															{task.asignados.length} usuario
															{task.asignados.length !== 1 ? "s" : ""}
														</span>
													</div>

													{/* Subtasks */}
													<div className="flex items-center space-x-1">
														<CheckCircle2 className="w-4 h-4" />
														<span>
															{task.subtareas.length} subtarea
															{task.subtareas.length !== 1 ? "s" : ""}
														</span>
													</div>

													{/* Due Date */}
													<div className="flex items-center space-x-1">
														<Calendar className="w-4 h-4" />
														<span>
															{new Date(
																task.fechaVencimiento,
															).toLocaleDateString()}
														</span>
													</div>
												</div>

												{/* Progress Bar */}
												<div className="mt-3">
													<div className="flex items-center justify-between mb-1">
														<span className="text-sm text-gray-600 dark:text-gray-400">
															Progreso: {task.progreso}%
														</span>
													</div>
													<Progress value={task.progreso} className="h-2" />
												</div>
											</div>
										</div>

										{/* Actions */}
										<div className="flex items-center space-x-2 ml-4">
											{/* User Avatars */}
											<div className="flex -space-x-2">
												{task.asignados.slice(0, 3).map((user, index) => (
													<div
														// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
														key={index}
														className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
														title={user}
													>
														{user
															.split(" ")
															.map((n) => n[0])
															.join("")}
													</div>
												))}
												{task.asignados.length > 3 && (
													<div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
														+{task.asignados.length - 3}
													</div>
												)}
											</div>

											{/* Task Actions */}
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreHorizontal className="w-4 h-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															updateTaskStatus(task.id, "En Progreso")
														}
													>
														<Play className="w-4 h-4 mr-2" />
														Iniciar
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															updateTaskStatus(task.id, "Suspendido")
														}
													>
														<Pause className="w-4 h-4 mr-2" />
														Pausar
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															updateTaskStatus(task.id, "Completado")
														}
													>
														<CheckCircle2 className="w-4 h-4 mr-2" />
														Completar
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															updateTaskStatus(task.id, "Cancelado")
														}
													>
														<XCircle className="w-4 h-4 mr-2" />
														Cancelar
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</CollapsibleTrigger>

								{/* Task Details */}
								<CollapsibleContent>
									<div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
										<div className="pt-4 space-y-4">
											{/* Description */}
											<div>
												<h4 className="font-medium text-gray-900 dark:text-white mb-2">
													Descripción
												</h4>
												<p className="text-gray-600 dark:text-gray-400">
													{task.descripcion}
												</p>
											</div>

											{/* Subtasks */}
											<div>
												<h4 className="font-medium text-gray-900 dark:text-white mb-3">
													Subtareas ({task.subtareas.length})
												</h4>
												<div className="space-y-2">
													{task.subtareas.map((subtask) => (
														<div
															key={subtask.id}
															className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
														>
															<div className="flex items-center space-x-3 flex-1">
																<div
																	className={`w-3 h-3 rounded-full ${getStatusColor(subtask.estado)}`}
																/>
																<span className="text-sm font-medium text-gray-900 dark:text-white">
																	{subtask.titulo}
																</span>
																<span className="text-xs text-gray-500">
																	• {subtask.asignado}
																</span>
															</div>

															<Select
																value={subtask.estado}
																onValueChange={(value) =>
																	updateSubtaskStatus(
																		task.id,
																		subtask.id,
																		value,
																	)
																}
															>
																<SelectTrigger className="w-32 h-8">
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="Pendiente">
																		Pendiente
																	</SelectItem>
																	<SelectItem value="En Progreso">
																		En Progreso
																	</SelectItem>
																	<SelectItem value="Completado">
																		Completado
																	</SelectItem>
																	<SelectItem value="Cancelado">
																		Cancelado
																	</SelectItem>
																	<SelectItem value="Suspendido">
																		Suspendido
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>
													))}
												</div>
											</div>
										</div>
									</div>
								</CollapsibleContent>
							</div>
						</Collapsible>
					);
				})}
			</div>

			{filteredTasks.length === 0 && (
				<div className="text-center py-12">
					<div className="text-gray-400 mb-4">
						<CheckCircle2 className="w-12 h-12 mx-auto" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
						No se encontraron tareas
					</h3>
					<p className="text-gray-500">
						{searchTerm || activeFiltersCount > 0
							? "Intenta ajustar los filtros de búsqueda"
							: "Crea tu primera tarea para comenzar"}
					</p>
				</div>
			)}
		</div>
	);
}
