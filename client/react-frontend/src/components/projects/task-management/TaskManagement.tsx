import { type FC, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Filter, Plus, Search, X } from "lucide-react";
import { useTasks } from "@/components/projects/task-management/hooks/useTask";
import { useTaskConfig } from "@/components/projects/task-management/hooks/useTaskConfig";
import type { Task } from "@/types/Task";
import DialogViewTask from "./modals/DialogViewTask";
import DialogCreateTask from "./modals/DialogCreateTask";
import { getPriorityColor } from "@/utils/util";
import { getStatusIcon } from "@/utils/util-components";
import { useProjectMembers } from "@/hooks/connection/useProjectMembers";
import { useGemini } from "@/hooks/connection/useGemini";

const TaskManagement: FC<{ project_id: string }> = ({ project_id }) => {
	const { tasks, loading, createTask, updateTask, deleteTask } =
		useTasks(project_id);
	const { config } = useTaskConfig(project_id);
	console.log("configuracion de tareas", config)
	// 1. Obtenemos los miembros del proyecto para el dropdown
	// TODO: Actualizar para que salgan miembros invitados aunque todavia no formen parte del proyecto. 
	const { members } = useProjectMembers(project_id);
	const { handleImprove, improvedText, loading: geminiIsLoading } = useGemini();

	// Mostrar vista previa cuando la IA genera una respuesta
	useEffect(() => {
		if (improvedText && !geminiIsLoading) {
			setShowImprovedPreview(true);
		}
	}, [improvedText, geminiIsLoading]);

	const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
	const [selectedTask, setselectedTask] = useState<Task | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDialogViewOpen, setisDialogOpenDialog] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const [searchTerm, setSearchTerm] = useState("");
	const [filterAssignee, setFilterAssignee] = useState("todos");
	const [filterType, setFilterType] = useState("todos");
	const [filterPriority, setFilterPriority] = useState("todos");
	const [filterStatus, setFilterStatus] = useState("todos");
	const [showFilters, setShowFilters] = useState(false);
	const [showImprovedPreview, setShowImprovedPreview] = useState(false);

	const handleSaveTask = async () => {
		if (!editingTask) return;
		setIsEditing(true);
		
		let success = false;
		if (editingTask.id && editingTask.id !== "new-task") {
			// Es una tarea existente, la actualizamos
			success = await updateTask(editingTask.id, editingTask);
		} else {
			// Es una nueva tarea, la creamos
			success = await createTask(editingTask);
		}

		if (success) {
			setEditingTask(null);
			setIsDialogOpen(false);
			setIsEditing(false);
		}
	};

	const handleEditTask = (task: Partial<Task | null>) => {
		setEditingTask(task);
		setisDialogOpenDialog(false);
		setIsDialogOpen(true);
	};

	const handleDeleteConfirmed = async (taskId: string) => {
		await deleteTask(taskId);
		setisDialogOpenDialog(false); // Cierra el diálogo de vista
	};

	const handleAddNewTask = () => {
		const defaultType = config?.types?.[0]?.name ?? "Tarea";
		const defaultPriority =
			config?.priorities?.find((p) => p.level === 2)?.name ??
			config?.priorities?.[0]?.name ??
			"Media";
		const defaultStatus = config?.states?.[0]?.name ?? "Pendiente";

		const newTask: Task = {
			id: "new-task", // Usar un ID temporal para nuevas tareas
			type: defaultType,
			priority: defaultPriority,
			title: "",
			description: "",
			status: defaultStatus,
			assignees: [],
			created_at: new Date().toISOString(),
			project_id,
		};
		setEditingTask(newTask);
		setIsDialogOpen(true);
	};

	// Función para filtrar tareas
	const getFilteredTasks = () => {
		return tasks.filter((task) => {
			const matchesSearch = task.title
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			const matchesAssignee =
				filterAssignee === "todos" ||
				// biome-ignore lint/complexity/useOptionalChain: <explanation>
				(task.assignees &&
					task.assignees.some((a) => a.name === filterAssignee));
			const matchesType = filterType === "todos" || task.type === filterType;
			const matchesStatus =
				filterStatus === "todos" || task.status === filterStatus;

			return matchesSearch && matchesAssignee && matchesType && matchesStatus;
		});
	};

	// Función para limpiar filtros
	const clearFilters = () => {
		setSearchTerm("");
		setFilterAssignee("todos");
		setFilterType("todos");
		setFilterPriority("todos");
		setFilterStatus("todos");
	};

	// Verificar si hay filtros activos
	const hasActiveFilters = () => {
		return (
			searchTerm !== "" ||
			filterAssignee !== "todos" ||
			filterType !== "todos" ||
			filterPriority !== "todos" ||
			filterStatus !== "todos"
		);
	};

	const getUniqueAssignees = () => {
		const allAssignees = tasks.flatMap((task) => task.assignees || []);
		const uniqueNames = Array.from(new Set(allAssignees.map((a) => a.name)));
		return uniqueNames;
	};

	// const getUniqueTypes = () => {
	// 	return [...new Set(tasks.map((task) => task.type))];
	// };

	const getUniquePriorities = () => {
		return [...new Set(tasks.map((task) => task.priority))];
	};

	const getUniqueStatuses = () => {
		return [...new Set(tasks.map((task) => task.status))];
	};

	return (
		<div className="bg-white h-full flex flex-col rounded-lg dark:border shadow-sm dark:bg-gray-800 dark:border-gray-700">
			<div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-none">
				<div className="flex justify-between items-start mb-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
							GESTIÓN DE TAREAS
						</h1>
						<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-400 mb-4">
							REGISTRO DE TAREAS Y ACTIVIDADES
						</h2>
					</div>
					<div className="text-right">
						<div className="text-sm font-medium">GT1</div>
					</div>
				</div>
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
						{/* Búsqueda */}
						<div className="relative flex-1 max-w-md">
							<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Buscar por título..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* Botones de acción */}
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								className={`${hasActiveFilters() ? "border-blue-500 text-blue-600 dark:text-blue-400" : ""}`}
							>
								<Filter className="w-4 h-4 mr-2" />
								Filtros
								{hasActiveFilters() && (
									<span className="ml-1 bg-blue-500 text-white rounded-full w-2 h-2" />
								)}
							</Button>

							{hasActiveFilters() && (
								<Button variant="ghost" size="sm" onClick={clearFilters}>
									<X className="w-4 h-4 mr-2" />
									Limpiar
								</Button>
							)}

							<Button onClick={handleAddNewTask}>
								<Plus className="w-4 h-4 mr-2" />
								Nueva Tarea
							</Button>
						</div>
					</div>

					{/* Panel de filtros expandible */}
					{showFilters && (
						<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{/* Filtro por usuario asignado */}
								<div>
									<Label className="text-sm font-medium mb-2 block">
										Usuario Asignado
									</Label>
									<Select
										value={filterAssignee}
										onValueChange={setFilterAssignee}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos los usuarios</SelectItem>
											{getUniqueAssignees().map((assignee) => (
												<SelectItem key={assignee} value={assignee}>
													{assignee}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Filtro por prioridad */}
								<div>
									<Label className="text-sm font-medium mb-2 block">
										Prioridad
									</Label>
									<Select
										value={filterPriority}
										onValueChange={setFilterPriority}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">
												Todas las prioridades
											</SelectItem>
											{getUniquePriorities().map((priority) => (
												<SelectItem key={priority} value={priority}>
													{priority}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Filtro por estado */}
								<div>
									<Label className="text-sm font-medium mb-2 block">
										Estado
									</Label>
									<Select value={filterStatus} onValueChange={setFilterStatus}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos los estados</SelectItem>
											{getUniqueStatuses().map((status) => (
												<SelectItem key={status} value={status}>
													{status}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Resumen de filtros activos */}
							{hasActiveFilters() && (
								<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
									<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
										<span>
											Mostrando {getFilteredTasks().length} de {tasks.length}{" "}
											tareas
										</span>
										{searchTerm && (
											<Badge variant="secondary" className="text-xs">
												Título: "{searchTerm}"
											</Badge>
										)}
										{filterAssignee !== "todos" && (
											<Badge variant="secondary" className="text-xs">
												Usuario: {filterAssignee}
											</Badge>
										)}
										{filterType !== "todos" && (
											<Badge variant="secondary" className="text-xs">
												Tipo: {filterType}
											</Badge>
										)}
										{filterPriority !== "todos" && (
											<Badge variant="secondary" className="text-xs">
												Prioridad: {filterPriority}
											</Badge>
										)}
										{filterStatus !== "todos" && (
											<Badge variant="secondary" className="text-xs">
												Estado: {filterStatus}
											</Badge>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="flex-grow overflow-y-auto p-6">
				<Table>
					<TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
						<TableRow>
							<TableHead className="text-center">ESTADO</TableHead>

							<TableHead className="text-left">TÍTULO</TableHead>
							<TableHead className="text-center">TIPO</TableHead>
							<TableHead className="text-center">PRIORIDAD</TableHead>
							<TableHead className="text-center">ASIGNADO</TableHead>
						</TableRow>
					</TableHeader>
					{loading ? (
						<TableBody>
							{[...Array(10)].map((_, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								<SkeletonTableRows key={index} />
							))}
						</TableBody>
					) : (
						<TableBody>
							{getFilteredTasks().map((task) => (
								<TableRow
									key={task.id}
									className="cursor-pointer"
									onClick={() => {
										setselectedTask(task);
										setEditingTask(task);
										setisDialogOpenDialog(true);
									}}
								>
									<TableCell className="text-center flex items-center justify-center">
										<div className="flex items-start justify-start gap-2">
											{getStatusIcon(task.status)}
										</div>
									</TableCell>

									<TableCell className="text-left">{task.title}</TableCell>
									<TableCell className="text-center">
										<Badge variant="outline" className="text-center">
											{task.type}
										</Badge>
									</TableCell>
									<TableCell className="text-center flex items-center justify-center">
										<Badge
											className="w-16 text-center flex items-center justify-center"
											variant={getPriorityColor(task.priority)}
										>
											{task.priority}
										</Badge>
									</TableCell>
									<TableCell className="text-center">
										<div className="text-center flex items-center justify-center">
											{task.assignees?.map((assignee) => (
												<div
													key={assignee.id}
													className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white"
													title={assignee?.name || assignee?.email || 'Usuario sin nombre'}
												>
													{assignee?.name?.charAt(0) || assignee?.email?.charAt(0) || '?'}
												</div>
											))}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					)}
				</Table>
			</div>

			<DialogCreateTask
				projectId={project_id}
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				editingTask={editingTask}
				setEditingTask={setEditingTask}
				tasks={tasks}
				members={members}
				isEditing={isEditing}
				handleSaveTask={handleSaveTask}
				geminiIsLoading={geminiIsLoading}
				improvedText={improvedText}
				handleImprove={handleImprove}
				showImprovedPreview={showImprovedPreview}
				setShowImprovedPreview={setShowImprovedPreview}
			/>
			{selectedTask && (
				<DialogViewTask
					isOpen={isDialogViewOpen}
					onOpenChange={setisDialogOpenDialog}
					selectedTask={selectedTask}
					onEditChange={() => handleEditTask(editingTask)}
					onDeleteChange={() =>
						handleDeleteConfirmed(selectedTask.id as string)
					}
				/>
			)}
		</div>
	);
};

const SkeletonTableRows: FC = () => {
	return (
		<TableRow className="cursor-pointer">
			<TableCell className="text-center">
				<Skeleton />
			</TableCell>
			<TableCell className="text-left">
				<Skeleton />
			</TableCell>
			<TableCell className="text-left">
				<Skeleton />
			</TableCell>
			<TableCell className="text-center">
				<Skeleton />
			</TableCell>
		</TableRow>
	);
};
export const Skeleton: FC = () => {
	return (
		<div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" />
	);
};

export default TaskManagement;
