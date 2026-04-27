import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Calendar,
	Clock,
	Edit3,
	Pause,
	Play,
	Plus,
	Square,
	Target,
	Trash2,
	User,
} from "lucide-react";
import api from "@/lib/api";
import useProjects from "@/hooks/connection/useProjects";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTimeTrackingStore } from "@/store/time-tracking";
import type { TimeEntry, TimeEntryStatus } from "@/types/TimeEntry";
import {
	formatDateTime,
	formatDuration,
	getEntryDurationSeconds,
} from "@/utils/time";

type TimeTrackingSectionProps = {
	projectId: string;
};

type ManualEntryForm = {
	project_id: string;
	start_time: string;
	end_time: string;
	status: TimeEntryStatus;
	description: string;
};

const toDateTimeLocal = (iso?: string | null) => {
	if (!iso) {
		return "";
	}
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "";
	}
	const offset = date.getTimezoneOffset() * 60000;
	return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const createDefaultManualForm = (
	projectId: string,
	entry?: TimeEntry,
): ManualEntryForm => ({
	project_id:
		entry?.project_id === null
			? "none"
			: entry?.project_id || projectId || "none",
	start_time: toDateTimeLocal(entry?.start_time),
	end_time: toDateTimeLocal(entry?.end_time),
	status: entry?.status || "completed",
	description: entry?.description || "",
});

const TimeTrackingSection = ({ projectId }: TimeTrackingSectionProps) => {
	const { projects } = useProjects();
	const { toast } = useToast();
	const [entries, setEntries] = useState<TimeEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [scopeProjectId, setScopeProjectId] = useState<string>("current");
	const [description, setDescription] = useState("");
	const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
	const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
	const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
	const [stoppingEntry, setStoppingEntry] = useState(false);
	const [manualEntryForm, setManualEntryForm] = useState<ManualEntryForm>(
		createDefaultManualForm(projectId),
	);
	const activeEntry = useTimeTrackingStore((state) => state.activeEntry);
	const now = useTimeTrackingStore((state) => state.now);
	const fetchActiveEntry = useTimeTrackingStore((state) => state.fetchActiveEntry);
	const startEntry = useTimeTrackingStore((state) => state.startEntry);
	const pauseEntry = useTimeTrackingStore((state) => state.pauseEntry);
	const resumeEntry = useTimeTrackingStore((state) => state.resumeEntry);
	const stopEntry = useTimeTrackingStore((state) => state.stopEntry);

	const refreshEntries = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (scopeProjectId !== "current" && scopeProjectId !== "none") {
				params.set("project_id", scopeProjectId);
			}
			if (scopeProjectId === "current") {
				params.set("project_id", projectId);
				params.set("include_team", "true");
			}
			const query = params.toString();
			const response = await api.get<TimeEntry[]>(
				`/api/time-entries${query ? `?${query}` : ""}`,
			);
			setEntries(response.data);
		} catch (error) {
			console.error("Error al obtener historial de tiempo:", error);
		} finally {
			setLoading(false);
		}
	}, [projectId, scopeProjectId]);

	useEffect(() => {
		void fetchActiveEntry();
	}, [fetchActiveEntry]);

	useEffect(() => {
		void refreshEntries();
	}, [refreshEntries]);

	useEffect(() => {
		void refreshEntries();
	}, [activeEntry?.id, activeEntry?.status, refreshEntries]);

	const handleStartGeneral = async () => {
		const entry = await startEntry({
			project_id:
				scopeProjectId === "none"
					? null
					: scopeProjectId === "current"
						? projectId
						: scopeProjectId,
			task_id: null,
			description: description.trim() || null,
		});

		if (entry) {
			setDescription("");
			void refreshEntries();
		}
	};

	const handleStopEntry = async () => {
		if (!activeEntry) return;
		
		setStoppingEntry(true);
		try {
			const result = await stopEntry(activeEntry.id);
			if (result) {
				toast({ title: "Tiempo detenido" });
				void refreshEntries();
			}
		} catch (error) {
			console.error("Error al detener:", error);
			toast({ title: "Error", description: "No se pudo detener el tiempo", variant: "destructive" });
		} finally {
			setStoppingEntry(false);
		}
	};

	const openCreateManualDialog = () => {
		setEditingEntry(null);
		setManualEntryForm(createDefaultManualForm(projectId));
		setIsManualDialogOpen(true);
	};

	const openEditManualDialog = (entry: TimeEntry) => {
		setEditingEntry(entry);
		setManualEntryForm(createDefaultManualForm(projectId, entry));
		setIsManualDialogOpen(true);
	};

	const saveManualEntry = async () => {
		if (!manualEntryForm.start_time) {
			toast({ title: "Start requerido", description: "Debes indicar fecha de inicio." });
			return;
		}

		if (
			manualEntryForm.status === "completed" &&
			!manualEntryForm.end_time
		) {
			toast({
				title: "Fin requerido",
				description: "Para completar una entrada manual debes indicar fecha de fin.",
			});
			return;
		}

		const payload = {
			project_id:
				manualEntryForm.project_id === "none"
					? null
					: manualEntryForm.project_id,
			task_id: null,
			start_time: new Date(manualEntryForm.start_time).toISOString(),
			end_time: manualEntryForm.end_time
				? new Date(manualEntryForm.end_time).toISOString()
				: null,
			status: manualEntryForm.status,
			description: manualEntryForm.description.trim() || null,
		};

		try {
			if (editingEntry) {
				await api.put(`/api/time-entries/${editingEntry.id}`, payload);
				toast({ title: "Registro actualizado" });
			} else {
				await api.post("/api/time-entries", payload);
				toast({ title: "Registro manual creado" });
			}
			setIsManualDialogOpen(false);
			setEditingEntry(null);
			setManualEntryForm(createDefaultManualForm(projectId));
			void fetchActiveEntry();
			void refreshEntries();
		} catch (error) {
			console.error("Error al guardar registro manual:", error);
			toast({
				title: "Error",
				description: "No se pudo guardar el registro manual.",
				variant: "destructive",
			});
		}
	};

	const confirmDelete = async () => {
		if (!entryToDelete) return;
		
		try {
			await api.delete(`/api/time-entries/${entryToDelete.id}`);
			toast({ title: "Registro eliminado" });
			void refreshEntries();
			void fetchActiveEntry();
		} catch (error) {
			console.error("Error al eliminar registro:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar el registro.",
				variant: "destructive",
			});
		} finally {
			setEntryToDelete(null);
		}
	};

	const activeDuration = activeEntry
		? formatDuration(getEntryDurationSeconds(activeEntry, now))
		: "00:00:00";

	const activeLabel = activeEntry?.task_title
		? `Tarea: ${activeEntry.task_title}`
		: activeEntry?.project_name
			? `Proyecto: ${activeEntry.project_name}`
			: "Tiempo general";

	const entriesTotal = useMemo(() => {
		return entries.reduce((total, entry) => {
			const seconds = getEntryDurationSeconds(entry, now);
			return total + seconds;
		}, 0);
	}, [entries, now]);

	const getStatusColor = (status: TimeEntry["status"]) => {
		switch (status) {
			case "running":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "paused":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "completed":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
		}
	};

	return (
		<div className="bg-white h-full w-full min-w-0 overflow-x-hidden flex flex-col rounded-lg dark:border shadow-sm dark:bg-gray-800 dark:border-gray-700 p-4 sm:p-6 space-y-6">
			<header className="space-y-2">
				<h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
					Time Tracking
				</h1>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					Registra tiempo general o revisa el historial de entradas del equipo.
				</p>
			</header>

			<section className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
				<div className="lg:col-span-2 min-w-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
					<div className="flex items-center gap-3">
						<div className="bg-blue-100 text-blue-700 p-2 rounded-full">
							<Clock className="w-5 h-5" />
						</div>
						<div>
							<p className="text-xs uppercase text-gray-500">Cronómetro activo</p>
							<p className="text-sm font-semibold text-gray-900 dark:text-white">
								{activeEntry ? activeLabel : "Sin cronómetro activo"}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<span className="text-2xl font-mono font-semibold text-gray-900 dark:text-white">
							{activeDuration}
						</span>
						{activeEntry && <Badge variant="outline">{activeEntry.status}</Badge>}
					</div>

					<div className="flex flex-wrap gap-2">
						<Button
							size="sm"
							onClick={() => activeEntry && pauseEntry(activeEntry.id)}
							disabled={!activeEntry || activeEntry.status !== "running"}
							variant="secondary"
						>
							<Pause className="w-4 h-4 mr-2" />
							Pausar
						</Button>
						<Button
							size="sm"
							onClick={() => activeEntry && resumeEntry(activeEntry.id)}
							disabled={!activeEntry || activeEntry.status !== "paused"}
							variant="secondary"
						>
							<Play className="w-4 h-4 mr-2" />
							Reanudar
						</Button>
						<Button
							size="sm"
							onClick={handleStopEntry}
							disabled={!activeEntry || stoppingEntry}
							variant="destructive"
						>
							{stoppingEntry ? (
								<span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
							) : (
								<Square className="w-4 h-4 mr-2" />
							)}
							{stoppingEntry ? "Deteniendo..." : "Finalizar"}
						</Button>
					</div>
				</div>

				<div className="min-w-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
					<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase">
						Nuevo registro
					</h2>
					<div className="space-y-2">
						<Label>Proyecto</Label>
						<Select value={scopeProjectId} onValueChange={setScopeProjectId}>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona proyecto" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="current">Proyecto actual</SelectItem>
								<SelectItem value="none">Sin proyecto</SelectItem>
								{projects.map((project) => (
									<SelectItem key={project.id} value={project.id}>
										{project.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Descripción</Label>
						<Input
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="Ej: planificación semanal"
						/>
					</div>
					<Button size="sm" onClick={handleStartGeneral} disabled={!!activeEntry}>
						<Play className="w-4 h-4 mr-2" />
						Iniciar cronómetro
					</Button>
					<Button size="sm" variant="outline" onClick={openCreateManualDialog}>
						<Plus className="w-4 h-4 mr-2" />
						Agregar manual
					</Button>
					{activeEntry && (
						<p className="text-xs text-gray-500">
							Ya tienes un cronómetro activo. Finalízalo para iniciar otro.
						</p>
					)}
				</div>
			</section>

			<section className="space-y-3">
				<div className="flex items-center justify-between gap-3 flex-wrap">
					<h2 className="text-base font-semibold text-gray-900 dark:text-white">
						Historial de registros
					</h2>
					<span className="text-sm text-gray-500">Total: {formatDuration(entriesTotal)}</span>
				</div>
				{loading ? (
					<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-500">
						Cargando...
					</div>
				) : entries.length === 0 ? (
					<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
						<Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
						<p className="text-sm text-gray-500">Sin registros de tiempo aún.</p>
					</div>
				) : (
					<div className="space-y-4 min-w-0">
						{entries.map((entry) => (
							<div
								key={entry.id}
								className="w-full min-w-0 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 hover:shadow-sm transition-shadow"
							>
								<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-2 flex-wrap">
											<p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
												{entry.task_title
													? `#${entry.task_number ?? ""} ${entry.task_title}`
													: entry.project_name || "Tiempo general"}
											</p>
											<Badge className={getStatusColor(entry.status)}>{entry.status}</Badge>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => openEditManualDialog(entry)}
											>
												<Edit3 className="w-4 h-4 mr-1" />
												Editar
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => setEntryToDelete(entry)}
											>
												<Trash2 className="w-4 h-4 mr-1" />
												Eliminar
											</Button>
										</div>

										<div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-600 dark:text-gray-400 min-w-0">
											<div className="flex items-center gap-1 min-w-0">
												<User className="w-3 h-3" />
												<span className="break-all">
													{entry.worker_name || entry.worker_email || "Usuario"}
												</span>
											</div>
											<div className="flex items-center gap-1 min-w-0">
												<Target className="w-3 h-3" />
												<span className="break-all">{entry.project_name || "Sin proyecto"}</span>
											</div>
											<div className="flex items-center gap-1 min-w-0">
												<Calendar className="w-3 h-3" />
												<span className="break-words">Inicio: {formatDateTime(entry.start_time)}</span>
											</div>
											<div className="flex items-center gap-1 min-w-0">
												<Calendar className="w-3 h-3" />
												<span className="break-words">Fin: {formatDateTime(entry.end_time)}</span>
											</div>
										</div>

										{entry.description && (
											<p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
												{entry.description}
											</p>
										)}
									</div>

									<div className="text-right md:text-right">
										<p className="text-xs text-gray-500 mb-1">Duración</p>
										<p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
											{formatDuration(getEntryDurationSeconds(entry, now))}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			<Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingEntry ? "Editar registro de tiempo" : "Nuevo registro manual"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-2">
							<Label>Proyecto</Label>
							<Select
								value={manualEntryForm.project_id}
								onValueChange={(value) =>
									setManualEntryForm((prev) => ({ ...prev, project_id: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona proyecto" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Sin proyecto</SelectItem>
									{projects.map((project) => (
										<SelectItem key={project.id} value={project.id}>
											{project.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Estado</Label>
							<Select
								value={manualEntryForm.status}
								onValueChange={(value: TimeEntryStatus) =>
									setManualEntryForm((prev) => ({ ...prev, status: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona estado" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="running">running</SelectItem>
									<SelectItem value="paused">paused</SelectItem>
									<SelectItem value="completed">completed</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Inicio</Label>
							<Input
								type="datetime-local"
								value={manualEntryForm.start_time}
								onChange={(event) =>
									setManualEntryForm((prev) => ({
										...prev,
										start_time: event.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Fin</Label>
							<Input
								type="datetime-local"
								value={manualEntryForm.end_time}
								onChange={(event) =>
									setManualEntryForm((prev) => ({
										...prev,
										end_time: event.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Descripción</Label>
							<Textarea
								value={manualEntryForm.description}
								onChange={(event) =>
									setManualEntryForm((prev) => ({
										...prev,
										description: event.target.value,
									}))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsManualDialogOpen(false)}
						>
							Cancelar
						</Button>
						<Button onClick={saveManualEntry}>Guardar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar registro de tiempo?</AlertDialogTitle>
					</AlertDialogHeader>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Estás a punto de eliminar el registro de tiempo de{" "}
						<strong>{entryToDelete?.project_name || "Tiempo general"}</strong>.
						Esta acción no se puede deshacer.
					</p>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default TimeTrackingSection;
