import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	AlertCircle,
	ChevronDown,
	ChevronRight,
	Filter,
	Plus,
	Search,
	Tag,
	User,
	X,
} from "lucide-react";
import { type FC, useEffect, useMemo, useState } from "react";
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
import {
	filterTasks,
	getDefaultTaskPreferences,
	groupTasks,
	loadTaskPreferences,
	saveTaskPreferences,
	sortTasks,
	type GroupBy,
	type SortField,
	type TaskListPreferences,
} from "./taskListUtils";

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

	const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
	const [selectedTask, setselectedTask] = useState<Task | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDialogViewOpen, setisDialogOpenDialog] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [showImprovedPreview, setShowImprovedPreview] = useState(false);
	const [preferences, setPreferences] = useState<TaskListPreferences>(() =>
		loadTaskPreferences(project_id),
	);

	useEffect(() => {
		setPreferences(loadTaskPreferences(project_id));
	}, [project_id]);

	useEffect(() => {
		saveTaskPreferences(project_id, preferences);
	}, [project_id, preferences]);

	useEffect(() => {
		if (error) setShowErrorDialog(true);
	}, [error]);

	useEffect(() => {
		if (improvedText && !geminiIsLoading) setShowImprovedPreview(true);
	}, [improvedText, geminiIsLoading]);

	const filteredTasks = useMemo(
		() => filterTasks(tasks, preferences),
		[tasks, preferences],
	);
	const orderedTasks = useMemo(
		() => sortTasks(filteredTasks, preferences, config),
		[filteredTasks, preferences, config],
	);
	const groupedTasks = useMemo(
		() => groupTasks(orderedTasks, preferences),
		[orderedTasks, preferences],
	);

	const handleSaveTask = async () => {
		if (!editingTask) return;
		setIsEditing(true);
		const success =
			editingTask.id && editingTask.id !== "new-task"
				? await updateTask(editingTask.id, editingTask)
				: await createTask(editingTask);
		if (success) {
			setEditingTask(null);
			setIsDialogOpen(false);
		}
		setIsEditing(false);
	};

	const handleEditTask = (task: Partial<Task | null>) => {
		setEditingTask(task);
		setisDialogOpenDialog(false);
		setIsDialogOpen(true);
	};

	const handleAddNewTask = () => {
		const defaultType = config?.types?.[0]?.name ?? "Tarea";
		const defaultPriority =
			config?.priorities?.find((p) => p.level === 2)?.name ??
			config?.priorities?.[0]?.name ??
			"Media";
		const defaultStatus = config?.states?.[0]?.name ?? "Pendiente";
		setEditingTask({
			id: "new-task",
			type: defaultType,
			priority: defaultPriority,
			title: "",
			description: "",
			status: defaultStatus,
			assignees: [],
			created_at: new Date().toISOString(),
			project_id,
		});
		setIsDialogOpen(true);
	};

	const handleDialogStatusChange = async (status: string) => {
		if (!selectedTask) return;
		const updated = await updateTask(selectedTask.id as string, { status });
		if (updated) setselectedTask((prev) => (prev ? { ...prev, status } : prev));
	};

	const updatePreference = <K extends keyof TaskListPreferences>(
		key: K,
		value: TaskListPreferences[K],
	) => {
		setPreferences((prev) => ({ ...prev, [key]: value }));
	};

	const toggleHiddenStatus = (status: string) => {
		setPreferences((prev) => ({
			...prev,
			hiddenStatuses: prev.hiddenStatuses.includes(status)
				? prev.hiddenStatuses.filter((current) => current !== status)
				: [...prev.hiddenStatuses, status],
		}));
	};

	const toggleGroupCollapsed = (groupLabel: string) => {
		setPreferences((prev) => ({
			...prev,
			collapsedGroups: prev.collapsedGroups.includes(groupLabel)
				? prev.collapsedGroups.filter((label) => label !== groupLabel)
				: [...prev.collapsedGroups, groupLabel],
		}));
	};

	const clearFilters = () => {
		const defaults = getDefaultTaskPreferences();
		setPreferences((prev) => ({
			...defaults,
			sortField: prev.sortField,
			sortDirection: prev.sortDirection,
			groupBy: prev.groupBy,
		}));
	};

	const resetAllView = () => setPreferences(getDefaultTaskPreferences());

	const hasActiveFilters =
		preferences.searchTerm !== "" ||
		preferences.assignee !== "todos" ||
		preferences.type !== "todos" ||
		preferences.priority !== "todos" ||
		preferences.status !== "todos" ||
		preferences.hiddenStatuses.length > 0;

	const getUniqueAssignees = () => {
		const allAssignees = tasks.flatMap((task) => task.assignees || []);
		return Array.from(new Set(allAssignees.map((a) => a.name)));
	};

	const sortDirectionIcon = preferences.sortDirection === "asc" ? ArrowUp : ArrowDown;
	const SortDirectionIcon = sortDirectionIcon;

	return (
		<div className="bg-white h-full flex flex-col rounded-lg dark:border shadow-sm dark:bg-gray-800 dark:border-gray-700">
			<div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-none">
				<div className="flex justify-between items-start mb-4">
					<div>
						<h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">GESTIÓN DE TAREAS</h1>
						<h2 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-400">{filteredTasks.length} de {tasks.length} tareas</h2>
					</div>
					<Button onClick={handleAddNewTask} size="sm" className="sm:size-default">
						<Plus className="w-4 h-4 sm:mr-2" />
						<span className="hidden sm:inline">Nueva Tarea</span>
					</Button>
				</div>

				<div className="space-y-3">
					<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
						<div className="relative flex-1">
							<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Buscar tareas..."
								value={preferences.searchTerm}
								onChange={(e) => updatePreference("searchTerm", e.target.value)}
								className="pl-10"
							/>
						</div>

						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowFilters((prev) => !prev)}
								className={`flex-1 sm:flex-none ${hasActiveFilters ? "border-blue-500 text-blue-600 dark:text-blue-400" : ""}`}
							>
								<Filter className="w-4 h-4 sm:mr-2" />
								<span className="hidden sm:inline">Filtros</span>
							</Button>
							<Button variant="ghost" size="sm" onClick={resetAllView} className="hidden sm:flex">
								<X className="w-4 h-4 mr-2" />
								Restablecer vista
							</Button>
						</div>
					</div>

					{showFilters && (
						<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 space-y-3">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
								<FilterSelect label="Usuario" value={preferences.assignee} onChange={(value) => updatePreference("assignee", value)} options={["todos", ...getUniqueAssignees()]} />
								<FilterSelect label="Tipo" value={preferences.type} onChange={(value) => updatePreference("type", value)} options={["todos", ...(config?.types?.map((type) => type.name) || [])]} />
								<FilterSelect label="Prioridad" value={preferences.priority} onChange={(value) => updatePreference("priority", value)} options={["todos", ...(config?.priorities?.map((priority) => priority.name) || [])]} />
								<FilterSelect label="Estado" value={preferences.status} onChange={(value) => updatePreference("status", value)} options={["todos", ...(config?.states?.map((state) => state.name) || [])]} />
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
								<FilterSelect
									label="Ordenar por"
									value={preferences.sortField}
									onChange={(value) => updatePreference("sortField", value as SortField)}
									options={["status", "created_at", "due_date", "name"]}
									labels={{ status: "Estado", created_at: "Fecha de creación", due_date: "Fecha límite", name: "Nombre" }}
								/>
								<div>
									<Label className="text-xs sm:text-sm font-medium mb-1.5 block">Dirección</Label>
									<Button variant="outline" className="w-full justify-between" onClick={() => updatePreference("sortDirection", preferences.sortDirection === "asc" ? "desc" : "asc")}> 
										<span>{preferences.sortDirection === "asc" ? "Ascendente" : "Descendente"}</span>
										<SortDirectionIcon className="w-4 h-4 text-blue-600" />
									</Button>
								</div>
								<FilterSelect
									label="Agrupar por"
									value={preferences.groupBy}
									onChange={(value) => updatePreference("groupBy", value as GroupBy)}
									options={["none", "type", "category", "assignee"]}
									labels={{ none: "Sin agrupación", type: "Tipo", category: "Categoría", assignee: "Asignado" }}
								/>
							</div>

							<div className="flex flex-wrap gap-2">
								{(config?.states || []).map((state) => (
									<Button
										key={state.name}
										variant={preferences.hiddenStatuses.includes(state.name) ? "outline" : "default"}
										size="sm"
										onClick={() => toggleHiddenStatus(state.name)}
									>
										{preferences.hiddenStatuses.includes(state.name) ? `Mostrar ${state.name}` : `Ocultar ${state.name}`}
									</Button>
								))}
							</div>

							<div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
								<div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
									<ArrowUpDown className="w-3.5 h-3.5" />
									<span>Activo: {preferences.sortField} ({preferences.sortDirection})</span>
								</div>
								<Button variant="ghost" size="sm" onClick={clearFilters} className="sm:hidden h-8">
									<X className="w-3 h-3 mr-1" />Limpiar filtros
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="flex-grow overflow-auto">
				<Table>
					<TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
						<TableRow>
							<TableHead className="hidden md:table-cell text-center w-20">ESTADO</TableHead>
							<TableHead className="hidden md:table-cell">TÍTULO</TableHead>
							<TableHead className="hidden md:table-cell text-center w-28">TIPO</TableHead>
							<TableHead className="hidden md:table-cell text-center w-28">PRIORIDAD</TableHead>
							<TableHead className="hidden md:table-cell text-center w-24">ASIGNADO</TableHead>
							<TableHead className="md:hidden text-center w-12 p-2"><AlertCircle className="w-4 h-4 mx-auto" /></TableHead>
							<TableHead className="md:hidden p-2">TAREA</TableHead>
							<TableHead className="md:hidden text-center w-12 p-2"><Tag className="w-4 h-4 mx-auto" /></TableHead>
							<TableHead className="md:hidden text-center w-12 p-2"><User className="w-4 h-4 mx-auto" /></TableHead>
						</TableRow>
					</TableHeader>
					{loading ? (
						<TableBody>{[...Array(10)].map((_, index) => <SkeletonTableRows key={index} />)}</TableBody>
					) : orderedTasks.length === 0 ? (
						<TableBody>
							<TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se encontraron tareas con la configuración actual.</TableCell></TableRow>
						</TableBody>
					) : (
						<TableBody>
							{groupedTasks.map((group) => (
								<>
									{preferences.groupBy !== "none" && (
										<TableRow key={`group-${group.key}`} className="bg-muted/40 hover:bg-muted/50">
											<TableCell colSpan={9}>
												<button type="button" className="flex items-center gap-2 font-semibold" onClick={() => toggleGroupCollapsed(group.label)}>
													{group.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} {group.label} <span className="text-muted-foreground text-xs">({group.tasks.length})</span>
												</button>
											</TableCell>
										</TableRow>
									)}
									{!group.isCollapsed && group.tasks.map((task) => (
										<TableRow key={task.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => { setselectedTask(task); setEditingTask(task); setisDialogOpenDialog(true); }}>
											<TableCell className="hidden md:table-cell"><div className="flex items-center justify-center">{getStatusIcon(task.status, config)}</div></TableCell>
											<TableCell className="hidden md:table-cell font-medium">{task.title}</TableCell>
											<TableCell className="hidden md:table-cell"><div className="flex justify-center"><Badge variant="outline">{task.type}</Badge></div></TableCell>
											<TableCell className="hidden md:table-cell"><div className="flex justify-center"><Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge></div></TableCell>
											<TableCell className="hidden md:table-cell text-center">{task.assignees?.[0]?.name || "—"}</TableCell>
											<TableCell className="md:hidden p-2"><div className="flex items-center justify-center">{getStatusIcon(task.status, config)}</div></TableCell>
											<TableCell className="md:hidden p-2"><span className="font-medium text-sm line-clamp-2">{task.title}</span></TableCell>
											<TableCell className="md:hidden p-2 text-center">{task.type}</TableCell>
											<TableCell className="md:hidden p-2 text-center">{task.assignees?.[0]?.name || "—"}</TableCell>
										</TableRow>
									))}
								</>
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
					onDeleteChange={() => deleteTask(selectedTask.id as string)}
					onStatusChange={handleDialogStatusChange}
				/>
			)}

			<CreditsErrorDialog
				open={showErrorDialog}
				onClose={() => setShowErrorDialog(false)}
				error={error}
				onRetry={error?.canRetry ? async () => { setShowErrorDialog(false); const success = await retry(); if (!success && error) setShowErrorDialog(true);} : undefined}
			/>
		</div>
	);
};

const FilterSelect: FC<{
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
	labels?: Record<string, string>;
}> = ({ label, value, onChange, options, labels }) => (
	<div>
		<Label className="text-xs sm:text-sm font-medium mb-1.5 block">{label}</Label>
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option} value={option}>{labels?.[option] || option}</SelectItem>
				))}
			</SelectContent>
		</Select>
	</div>
);

const SkeletonTableRows: FC = () => (
	<TableRow>
		<TableCell className="hidden md:table-cell"><Skeleton /></TableCell>
		<TableCell className="hidden md:table-cell"><Skeleton /></TableCell>
		<TableCell className="hidden md:table-cell"><Skeleton /></TableCell>
		<TableCell className="hidden md:table-cell"><Skeleton /></TableCell>
		<TableCell className="hidden md:table-cell"><Skeleton /></TableCell>
		<TableCell className="md:hidden p-2"><Skeleton /></TableCell>
		<TableCell className="md:hidden p-2"><Skeleton /></TableCell>
		<TableCell className="md:hidden p-2"><Skeleton /></TableCell>
		<TableCell className="md:hidden p-2"><Skeleton /></TableCell>
	</TableRow>
);

export const Skeleton: FC = () => (
	<div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" />
);

export default TaskManagement;
