import { Filter, Plus, Search, X, User, Tag, AlertCircle } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { useTasks } from "@/components/projects/task-management/hooks/useTask";
import { useTaskConfig } from "@/components/projects/task-management/hooks/useTaskConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useGemini } from "./hooks/useTaskAIAgent";
import { useProjectMembers } from "@/hooks/connection/useProjectMembers";
import type { Task } from "@/types/Task";
import { getPriorityColor } from "@/utils/util";
import { getStatusIcon } from "@/utils/util-components";
import DialogCreateTask from "./modals/DialogCreateTask";
import DialogViewTask from "./modals/DialogViewTask";
import { CreditsErrorDialog } from "./modals/CreditErrorsDialog";

const TaskManagement: FC<{ project_id: string }> = ({ project_id }) => {
	const { tasks, loading, createTask, updateTask, deleteTask } =
		useTasks(project_id);
	const { config } = useTaskConfig(project_id);
	const { members } = useProjectMembers(project_id);
	const [showErrorDialog, setShowErrorDialog] = useState(false);
	const {
		handleImprove,
		improvedText,
		error,
		loading: geminiIsLoading,
		retry,
	} = useGemini();

	useEffect(() => {
		if (error) {
			setShowErrorDialog(true);
		}
	}, [error]);

	const handleCloseErrorDialog = () => {
		setShowErrorDialog(false);
	};

	const handleRetry = async () => {
		setShowErrorDialog(false);
		const success = await retry();

		if (!success && error) {
			setShowErrorDialog(true);
		}
	};

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
			success = await updateTask(editingTask.id, editingTask);
		} else {
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
		setisDialogOpenDialog(false);
	};

	const handleQuickStatusChange = async (taskId: string, status: string) => {
		await updateTask(taskId, { status });

		if (selectedTask?.id === taskId) {
			setselectedTask((prev) => (prev ? { ...prev, status } : prev));
		}
	};

	const handleAddNewTask = () => {
		const defaultType = config?.types?.[0]?.name ?? "Tarea";
		const defaultPriority =
			config?.priorities?.find((p) => p.level === 2)?.name ??
			config?.priorities?.[0]?.name ??
			"Media";
		const defaultStatus = config?.states?.[0]?.name ?? "Pendiente";

		const newTask: Task = {
			id: "new-task",
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

	const getFilteredTasks = () => {
		return tasks.filter((task) => {
			const matchesSearch = task.title
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			const matchesAssignee =
				filterAssignee === "todos" ||
				(task.assignees &&
					task.assignees.some((a) => a.name === filterAssignee));
			const matchesType = filterType === "todos" || task.type === filterType;
			const matchesStatus =
				filterStatus === "todos" || task.status === filterStatus;
			const matchesPriority =
				filterPriority === "todos" || task.priority === filterPriority;

			return (
				matchesSearch &&
				matchesAssignee &&
				matchesType &&
				matchesStatus &&
				matchesPriority
			);
		});
	};

	const clearFilters = () => {
		setSearchTerm("");
		setFilterAssignee("todos");
		setFilterType("todos");
		setFilterPriority("todos");
		setFilterStatus("todos");
	};

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

	const getUniquePriorities = () => {
		return [...new Set(tasks.map((task) => task.priority))];
	};

	const getUniqueStatuses = () => {
		return [...new Set(tasks.map((task) => task.status))];
	};

	const statusOptions = config?.states?.map((state) => state.name) ??
		getUniqueStatuses();

	return (
		<div className="bg-white h-full flex flex-col rounded-lg dark:border shadow-sm dark:bg-gray-800 dark:border-gray-700">
			{/* Header */}
			<div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-none">
				<div className="flex justify-between items-start mb-4">
					<div>
						<h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
							GESTIÓN DE TAREAS
						</h1>
						<h2 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-400">
							{tasks.length} {tasks.length === 1 ? "tarea" : "tareas"}
						</h2>
					</div>
					<Button
						onClick={handleAddNewTask}
						size="sm"
						className="sm:size-default"
					>
						<Plus className="w-4 h-4 sm:mr-2" />
						<span className="hidden sm:inline">Nueva Tarea</span>
					</Button>
				</div>

				<div className="space-y-3">
					{/* Búsqueda y Filtros */}
					<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
						<div className="relative flex-1">
							<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Buscar tareas..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>

						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								className={`flex-1 sm:flex-none ${hasActiveFilters() ? "border-blue-500 text-blue-600 dark:text-blue-400" : ""}`}
							>
								<Filter className="w-4 h-4 sm:mr-2" />
								<span className="hidden sm:inline">Filtros</span>
								{hasActiveFilters() && (
									<span className="ml-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
										{
											[
												searchTerm,
												filterAssignee !== "todos",
												filterType !== "todos",
												filterPriority !== "todos",
												filterStatus !== "todos",
											].filter(Boolean).length
										}
									</span>
								)}
							</Button>

							{hasActiveFilters() && (
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFilters}
									className="hidden sm:flex"
								>
									<X className="w-4 h-4 mr-2" />
									Limpiar
								</Button>
							)}
						</div>
					</div>

					{/* Panel de filtros */}
					{showFilters && (
						<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 space-y-3">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
								<div>
									<Label className="text-xs sm:text-sm font-medium mb-1.5 block">
										Usuario
									</Label>
									<Select
										value={filterAssignee}
										onValueChange={setFilterAssignee}
									>
										<SelectTrigger className="h-9">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos</SelectItem>
											{getUniqueAssignees().map((assignee) => (
												<SelectItem key={assignee} value={assignee}>
													{assignee}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label className="text-xs sm:text-sm font-medium mb-1.5 block">
										Tipo
									</Label>
									<Select value={filterType} onValueChange={setFilterType}>
										<SelectTrigger className="h-9">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos</SelectItem>
											{config?.types?.map((type) => (
												<SelectItem key={type.name} value={type.name}>
													{type.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label className="text-xs sm:text-sm font-medium mb-1.5 block">
										Prioridad
									</Label>
									<Select
										value={filterPriority}
										onValueChange={setFilterPriority}
									>
										<SelectTrigger className="h-9">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todas</SelectItem>
											{getUniquePriorities().map((priority) => (
												<SelectItem key={priority} value={priority}>
													{priority}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label className="text-xs sm:text-sm font-medium mb-1.5 block">
										Estado
									</Label>
									<Select value={filterStatus} onValueChange={setFilterStatus}>
										<SelectTrigger className="h-9">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos</SelectItem>
											{getUniqueStatuses().map((status) => (
												<SelectItem key={status} value={status}>
													{status}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Resumen y botón limpiar en móvil */}
							<div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
								<span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
									{getFilteredTasks().length} de {tasks.length} tareas
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFilters}
									className="sm:hidden h-8"
								>
									<X className="w-3 h-3 mr-1" />
									Limpiar
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Table */}
			<div className="flex-grow overflow-auto">
				<Table>
					<TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
						<TableRow>
							{/* Versión Desktop */}
							<TableHead className="hidden md:table-cell text-center w-20">
								ESTADO
							</TableHead>
							<TableHead className="hidden md:table-cell">TÍTULO</TableHead>
							<TableHead className="hidden md:table-cell text-center w-28">
								TIPO
							</TableHead>
							<TableHead className="hidden md:table-cell text-center w-28">
								PRIORIDAD
							</TableHead>
							<TableHead className="hidden md:table-cell text-center w-24">
								ASIGNADO
							</TableHead>

							{/* Versión Mobile - Solo iconos */}

							<TableHead className="md:hidden text-center w-12 p-2">
								<div
									className="flex items-center justify-center"
									title="Estado"
								>
									<AlertCircle className="w-4 h-4" />
								</div>
							</TableHead>
							<TableHead className="md:hidden p-2">TAREA</TableHead>
							<TableHead className="md:hidden text-center w-12 p-2">
								<div className="flex items-center justify-center" title="Tipo">
									<Tag className="w-4 h-4" />
								</div>
							</TableHead>
							<TableHead className="md:hidden text-center w-12 p-2">
								<div
									className="flex items-center justify-center"
									title="Asignado"
								>
									<User className="w-4 h-4" />
								</div>
							</TableHead>
						</TableRow>
					</TableHeader>

					{loading ? (
						<TableBody>
							{[...Array(10)].map((_, index) => (
								<SkeletonTableRows key={index} />
							))}
						</TableBody>
					) : getFilteredTasks().length === 0 ? (
						<TableBody>
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center py-8 text-muted-foreground"
								>
									{hasActiveFilters()
										? "No se encontraron tareas con los filtros aplicados"
										: "No hay tareas creadas. ¡Crea tu primera tarea!"}
								</TableCell>
							</TableRow>
						</TableBody>
					) : (
						<TableBody>
							{getFilteredTasks().map((task) => (
								<TableRow
									key={task.id}
									className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
									onClick={() => {
										setselectedTask(task);
										setEditingTask(task);
										setisDialogOpenDialog(true);
									}}
								>
							{/* Desktop Version */}
							<TableCell className="hidden md:table-cell">
								<div
									className="flex items-center justify-center"
									onClick={(event) => event.stopPropagation()}
								>
									<Select
										value={task.status}
										onValueChange={(value) =>
											handleQuickStatusChange(task.id as string, value)
										}
									>
										<SelectTrigger className="h-8 w-40">
											<div className="flex items-center gap-2 truncate">
												{getStatusIcon(task.status)}
												<SelectValue />
											</div>
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((status) => (
												<SelectItem key={status} value={status}>
													{status}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</TableCell>
									<TableCell className="hidden md:table-cell font-medium">
										{task.title}
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<div className="flex justify-center">
											<Badge
												variant="outline"
												style={{
													backgroundColor:
														config?.types?.find((t) => t.name === task.type)
															?.color + "20",
													borderColor: config?.types?.find(
														(t) => t.name === task.type,
													)?.color,
												}}
											>
												{task.type}
											</Badge>
										</div>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<div className="flex justify-center">
											<Badge
												variant={getPriorityColor(task.priority)}
												style={{
													backgroundColor:
														config?.priorities?.find(
															(p) => p.name === task.priority,
														)?.color + "20",
													borderColor: config?.priorities?.find(
														(p) => p.name === task.priority,
													)?.color,
													color: config?.priorities?.find(
														(p) => p.name === task.priority,
													)?.color,
												}}
											>
												{task.priority}
											</Badge>
										</div>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<div className="flex items-center justify-center gap-1">
											{task.assignees?.slice(0, 3).map((assignee) => (
												<div
													key={assignee.id}
													className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white dark:border-gray-800 shadow-sm"
													title={assignee?.name || assignee?.email || "Usuario"}
												>
													{(
														assignee?.name?.charAt(0) ||
														assignee?.email?.charAt(0) ||
														"?"
													).toUpperCase()}
												</div>
											))}
											{task.assignees && task.assignees.length > 3 && (
												<div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
													+{task.assignees.length - 3}
												</div>
											)}
										</div>
									</TableCell>

							{/* Mobile Version */}
							<TableCell className="md:hidden p-2">
								<div
									className="flex items-center justify-center"
									onClick={(event) => event.stopPropagation()}
								>
									<Select
										value={task.status}
										onValueChange={(value) =>
											handleQuickStatusChange(task.id as string, value)
										}
									>
										<SelectTrigger className="h-8 w-10 p-0 justify-center">
											{getStatusIcon(task.status)}
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((status) => (
												<SelectItem key={status} value={status}>
													{status}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</TableCell>
									<TableCell className="md:hidden p-2">
										<div className="flex flex-col gap-1">
											<span className="font-medium text-sm line-clamp-2">
												{task.title}
											</span>
											<div className="flex items-center gap-1">
												<Badge
													variant={getPriorityColor(task.priority)}
													className="text-xs px-1.5 py-0"
													style={{
														backgroundColor:
															config?.priorities?.find(
																(p) => p.name === task.priority,
															)?.color + "20",
														borderColor: config?.priorities?.find(
															(p) => p.name === task.priority,
														)?.color,
														color: config?.priorities?.find(
															(p) => p.name === task.priority,
														)?.color,
													}}
												>
													{task.priority}
												</Badge>
											</div>
										</div>
									</TableCell>
									<TableCell className="md:hidden p-2">
										<div className="flex justify-center">
											<div
												className="w-2 h-2 rounded-full"
												style={{
													backgroundColor: config?.types?.find(
														(t) => t.name === task.type,
													)?.color,
												}}
												title={task.type}
											/>
										</div>
									</TableCell>
									<TableCell className="md:hidden p-2">
										<div className="flex items-center justify-center -space-x-1">
											{task.assignees?.slice(0, 2).map((assignee) => (
												<div
													key={assignee.id}
													className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white dark:border-gray-800"
													title={assignee?.name || assignee?.email}
												>
													{(
														assignee?.name?.charAt(0) ||
														assignee?.email?.charAt(0) ||
														"?"
													).toUpperCase()}
												</div>
											))}
											{task.assignees && task.assignees.length > 2 && (
												<div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-gray-800">
													+{task.assignees.length - 2}
												</div>
											)}
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

			<CreditsErrorDialog
				open={showErrorDialog}
				onClose={handleCloseErrorDialog}
				error={error}
				onRetry={error?.canRetry ? handleRetry : undefined}
			/>
		</div>
	);
};

const SkeletonTableRows: FC = () => {
	return (
		<TableRow>
			<TableCell className="hidden md:table-cell">
				<Skeleton />
			</TableCell>
			<TableCell className="hidden md:table-cell">
				<Skeleton />
			</TableCell>
			<TableCell className="hidden md:table-cell">
				<Skeleton />
			</TableCell>
			<TableCell className="hidden md:table-cell">
				<Skeleton />
			</TableCell>
			<TableCell className="hidden md:table-cell">
				<Skeleton />
			</TableCell>
			<TableCell className="md:hidden p-2">
				<Skeleton />
			</TableCell>
			<TableCell className="md:hidden p-2">
				<Skeleton />
			</TableCell>
			<TableCell className="md:hidden p-2">
				<Skeleton />
			</TableCell>
			<TableCell className="md:hidden p-2">
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
