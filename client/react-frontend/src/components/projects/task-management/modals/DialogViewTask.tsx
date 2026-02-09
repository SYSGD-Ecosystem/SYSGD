import {
	AlertCircle,
	Calendar,
	Pause,
	Play,
	Square,
	Tag,
	User,
} from "lucide-react";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";
import { useTaskConfig } from "@/components/projects/task-management/hooks/useTaskConfig";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task } from "@/types/Task";
import type { TimeEntry } from "@/types/TimeEntry";
import { useTimeTrackingStore } from "@/store/time-tracking";
import { formatDuration, getEntryDurationSeconds } from "@/utils/time";
import { getPriorityColor } from "@/utils/util";
import { getStatusIcon } from "@/utils/util-components";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Dialog, DialogContent } from "../../../ui/dialog";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

const DialogViewTask: FC<{
	selectedTask: Task;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onEditChange: () => void;
	onDeleteChange: () => void;
}> = ({ selectedTask, isOpen, onOpenChange, onEditChange, onDeleteChange }) => {
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);
	const [entries, setEntries] = useState<TimeEntry[]>([]);
	const [loadingEntries, setLoadingEntries] = useState(false);
	const [description, setDescription] = useState("");

	const { config: taskConfig } = useTaskConfig(selectedTask.project_id);
	const activeEntry = useTimeTrackingStore((state) => state.activeEntry);
	const now = useTimeTrackingStore((state) => state.now);
	const fetchActiveEntry = useTimeTrackingStore((state) => state.fetchActiveEntry);
	const startEntry = useTimeTrackingStore((state) => state.startEntry);
	const pauseEntry = useTimeTrackingStore((state) => state.pauseEntry);
	const resumeEntry = useTimeTrackingStore((state) => state.resumeEntry);
	const stopEntry = useTimeTrackingStore((state) => state.stopEntry);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setIsButtonDisabled(false);
	}, [selectedTask]);

	useEffect(() => {
		if (!isOpen) return;
		void fetchActiveEntry();
	}, [fetchActiveEntry, isOpen]);

	const refreshEntries = useCallback(async () => {
		setLoadingEntries(true);
		try {
			const response = await api.get<TimeEntry[]>(
				`/api/time-entries?task_id=${selectedTask.id}`,
			);
			setEntries(response.data);
		} catch (error) {
			console.error("Error al cargar registros de tiempo:", error);
		} finally {
			setLoadingEntries(false);
		}
	}, [selectedTask.id]);

	useEffect(() => {
		if (!isOpen) return;
		void refreshEntries();
	}, [isOpen, refreshEntries]);

	const taskActiveEntry =
		activeEntry && activeEntry.task_id === selectedTask.id
			? activeEntry
			: null;
	const hasOtherActiveEntry =
		activeEntry && activeEntry.task_id !== selectedTask.id;

	const totalSeconds = useMemo(() => {
		return entries.reduce((total, entry) => {
			return total + getEntryDurationSeconds(entry, now);
		}, 0);
	}, [entries, now]);

	const handleStartTimer = async () => {
		const started = await startEntry({
			project_id: selectedTask.project_id,
			task_id: selectedTask.id,
			description: description.trim() || null,
		});
		if (started) {
			setDescription("");
			await refreshEntries();
		}
	};

	useEffect(() => {
		if (!isOpen) return;
		if (!activeEntry || activeEntry.task_id === selectedTask.id) {
			void refreshEntries();
		}
	}, [activeEntry, isOpen, refreshEntries, selectedTask.id]);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col">
				{/* Header compacto */}
				<div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
					<div className="flex flex-col items-start justify-between">
						<div className="flex-1 min-w-0">
							<h1 className="text-xl md:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-2 pr-4">
								{selectedTask.title}
							</h1>
						</div>
						<div className="flex items-center gap-4 justify-between w-full">
							<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
								<div className="flex items-center gap-1">
									<Tag className="w-4 h-4" />
									<span>#{selectedTask.project_task_number}</span>
								</div>
								<div className="flex items-center gap-1">
									<Calendar className="w-4 h-4" />
									<span>
										{new Date(selectedTask.created_at).toLocaleDateString()}
									</span>
								</div>
							</div>

							<div className="flex w-full justify-end items-center gap-2">
								<Badge
									style={{
										backgroundColor: getPriorityColor(
											selectedTask.priority,
											taskConfig,
										),
										color: "white",
									}}
									className="shrink-0"
								>
									{selectedTask.priority}
								</Badge>
								<div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md shrink-0">
									{getStatusIcon(selectedTask.status, taskConfig)}
									<span className="text-sm font-medium">
										{selectedTask.status}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Contenido principal con scroll */}
				<ScrollArea className="flex-1 p-6 overflow-y-auto">
					<div className="space-y-6">
						<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-4">
							<div className="flex items-center justify-between flex-wrap gap-3">
								<div>
									<p className="text-xs uppercase text-gray-500">Time Tracking</p>
									<p className="text-lg font-semibold text-gray-900 dark:text-white">
										{taskActiveEntry
											? formatDuration(
													getEntryDurationSeconds(taskActiveEntry, now),
												)
											: "00:00:00"}
									</p>
									<p className="text-xs text-gray-500">
										Total acumulado: {formatDuration(totalSeconds)}
									</p>
								</div>
								{taskActiveEntry && (
									<Badge variant="outline">{taskActiveEntry.status}</Badge>
								)}
							</div>

							<div className="flex flex-wrap gap-2">
								<Button
									size="sm"
									onClick={handleStartTimer}
									disabled={!!activeEntry}
								>
									<Play className="w-4 h-4 mr-2" />
									Iniciar cronómetro
								</Button>
								<Button
									size="sm"
									variant="secondary"
									onClick={() =>
										taskActiveEntry && pauseEntry(taskActiveEntry.id)
									}
									disabled={!taskActiveEntry || taskActiveEntry.status !== "running"}
								>
									<Pause className="w-4 h-4 mr-2" />
									Pausar
								</Button>
								<Button
									size="sm"
									variant="secondary"
									onClick={() =>
										taskActiveEntry && resumeEntry(taskActiveEntry.id)
									}
									disabled={!taskActiveEntry || taskActiveEntry.status !== "paused"}
								>
									<Play className="w-4 h-4 mr-2" />
									Reanudar
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={() => taskActiveEntry && stopEntry(taskActiveEntry.id)}
									disabled={!taskActiveEntry}
								>
									<Square className="w-4 h-4 mr-2" />
									Finalizar
								</Button>
							</div>

							<div className="space-y-2">
								<Label>Descripción del registro</Label>
								<Input
									value={description}
									onChange={(event) => setDescription(event.target.value)}
									placeholder="Ej: revisión de requerimientos"
									disabled={!!activeEntry}
								/>
								{hasOtherActiveEntry && (
									<p className="text-xs text-amber-600">
										Ya tienes un cronómetro activo en otra tarea.
									</p>
								)}
							</div>
							{loadingEntries && (
								<p className="text-xs text-gray-500">
									Actualizando registros de tiempo...
								</p>
							)}
						</div>

						{/* Descripción - Sin label redundante */}
						{selectedTask.description && (
							<div>
								<div className="prose prose-lg dark:prose-invert max-w-none">
									<ReactMarkdown>{selectedTask.description}</ReactMarkdown>
								</div>
							</div>
						)}

						{/* Metadatos compactos */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* Tipo */}
							<div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<Tag className="w-5 h-5 text-gray-500" />
								<div>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										Tipo
									</p>
									<p className="font-medium text-gray-900 dark:text-white">
										{selectedTask.type}
									</p>
								</div>
							</div>

							{/* Asignados */}
							<div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<User className="w-5 h-5 text-gray-500" />
								<div className="flex-1 min-w-0">
									<p className="text-xs text-gray-500 dark:text-gray-400">
										Asignado a
									</p>
									<div className="flex flex-wrap gap-1 mt-1">
										{selectedTask.assignees &&
										selectedTask.assignees.length > 0 ? (
											selectedTask.assignees.slice(0, 2).map((assignee) => (
												<Badge
													key={assignee.id}
													variant="outline"
													className="text-xs"
												>
													{assignee?.name ||
														assignee?.email ||
														"Usuario sin nombre"}
												</Badge>
											))
										) : (
											<span className="text-sm text-gray-500">Sin asignar</span>
										)}
										{selectedTask.assignees &&
											selectedTask.assignees.length > 2 && (
												<Badge variant="outline" className="text-xs">
													+{selectedTask.assignees.length - 2}
												</Badge>
											)}
									</div>
								</div>
							</div>

							{/* Información adicional */}
							<div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<AlertCircle className="w-5 h-5 text-gray-500" />
								<div>
									<p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
									<p className="font-mono text-sm text-gray-900 dark:text-white">
										{selectedTask.id}
									</p>
								</div>
							</div>
						</div>
					</div>
				</ScrollArea>

				{/* Botones fijos en la parte inferior */}
				<div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
					<div className="flex justify-end gap-3">
						<Button
							variant="outline"
							disabled={isButtonDisabled}
							onClick={onEditChange}
						>
							Editar
						</Button>
						<Button
							variant="destructive"
							disabled={isButtonDisabled}
							onClick={() => {
								setIsButtonDisabled(true);
								onDeleteChange();
							}}
						>
							Eliminar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DialogViewTask;
