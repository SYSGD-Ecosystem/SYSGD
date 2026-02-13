import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Pause, Play, Square, Target } from "lucide-react";
import api from "@/lib/api";
import useProjects from "@/hooks/connection/useProjects";
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
import { useTimeTrackingStore } from "@/store/time-tracking";
import type { TimeEntry } from "@/types/TimeEntry";
import { formatDateTime, formatDuration, getEntryDurationSeconds } from "@/utils/time";

type TimeTrackingSectionProps = {
	projectId: string;
};

const TimeTrackingSection = ({ projectId }: TimeTrackingSectionProps) => {
	const { projects } = useProjects();
	const [entries, setEntries] = useState<TimeEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [scopeProjectId, setScopeProjectId] = useState<string>("current");
	const [description, setDescription] = useState("");
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
	}, [scopeProjectId]);

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
		<div className="bg-white h-full flex flex-col rounded-lg dark:border shadow-sm dark:bg-gray-800 dark:border-gray-700 p-6 space-y-6">
			<header className="space-y-2">
				<h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
					Time Tracking
				</h1>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					Registra tiempo general o revisa el historial de tus entradas.
				</p>
			</header>

			<section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
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
						{activeEntry && (
							<Badge variant="outline">{activeEntry.status}</Badge>
						)}
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
							onClick={() => activeEntry && stopEntry(activeEntry.id)}
							disabled={!activeEntry}
							variant="destructive"
						>
							<Square className="w-4 h-4 mr-2" />
							Finalizar
						</Button>
					</div>
				</div>

				<div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
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
					<Button
						size="sm"
						onClick={handleStartGeneral}
						disabled={!!activeEntry}
					>
						<Play className="w-4 h-4 mr-2" />
						Iniciar cronómetro
					</Button>
					{activeEntry && (
						<p className="text-xs text-gray-500">
							Ya tienes un cronómetro activo. Finalízalo para iniciar otro.
						</p>
					)}
				</div>
			</section>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-base font-semibold text-gray-900 dark:text-white">
						Historial de registros
					</h2>
					<span className="text-sm text-gray-500">
						Total: {formatDuration(entriesTotal)}
					</span>
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
					<div className="space-y-4">
						{entries.map((entry) => (
							<div
								key={entry.id}
								className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 hover:shadow-sm transition-shadow"
							>
								<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-2 flex-wrap">
											<p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
												{entry.task_title
													? `#${entry.task_number ?? ""} ${entry.task_title}`
													: entry.project_name || "Tiempo general"}
											</p>
											<Badge className={getStatusColor(entry.status)}>
												{entry.status}
											</Badge>
										</div>

										<div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
											<div className="flex items-center gap-1">
												<Target className="w-3 h-3" />
												<span>{entry.project_name || "Sin proyecto"}</span>
											</div>
											<div className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												<span>Inicio: {formatDateTime(entry.start_time)}</span>
											</div>
											<div className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												<span>Fin: {formatDateTime(entry.end_time)}</span>
											</div>
										</div>

										{entry.description && (
											<p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
												{entry.description}
											</p>
										)}
									</div>

									<div className="text-right">
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
		</div>
	);
};

export default TimeTrackingSection;
