"use client";

import {
	Calendar,
	Clock,
	Edit,
	Pause,
	Play,
	Plus,
	Square,
	Target,
	Timer,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TimeEntry {
	id: number;
	tarea: string;
	proyecto: string;
	descripcion: string;
	tiempoInicio: Date;
	tiempoFin?: Date;
	duracion: number; // en segundos
	estado: "activo" | "pausado" | "completado";
	fecha: string;
}

export function TimeTracking() {
	const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
		{
			id: 1,
			tarea: "Implementar autenticación",
			proyecto: "SYSGD",
			descripcion: "Desarrollo del módulo de login y registro",
			tiempoInicio: new Date(Date.now() - 3600000), // 1 hora atrás
			tiempoFin: new Date(),
			duracion: 3600,
			estado: "completado",
			fecha: "2025-07-11",
		},
		{
			id: 2,
			tarea: "Diseño de interfaz",
			proyecto: "E-commerce",
			descripcion: "Creación de mockups para la tienda online",
			tiempoInicio: new Date(Date.now() - 1800000), // 30 min atrás
			duracion: 1800,
			estado: "pausado",
			fecha: "2025-07-11",
		},
	]);

	const [activeTimer, setActiveTimer] = useState<number | null>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [newEntry, setNewEntry] = useState({
		tarea: "",
		proyecto: "",
		descripcion: "",
	});
	if (currentTime === 0) {
	}
	// Timer effect
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (activeTimer !== null) {
			interval = setInterval(() => {
				setCurrentTime((prev) => prev + 1);
				setTimeEntries((entries) =>
					entries.map((entry) =>
						entry.id === activeTimer
							? { ...entry, duracion: entry.duracion + 1 }
							: entry,
					),
				);
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [activeTimer]);

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const startTimer = (entryId: number) => {
		if (activeTimer !== null) {
			// Pausar timer activo
			setTimeEntries((entries) =>
				entries.map((entry) =>
					entry.id === activeTimer ? { ...entry, estado: "pausado" } : entry,
				),
			);
		}

		setActiveTimer(entryId);
		setTimeEntries((entries) =>
			entries.map((entry) =>
				entry.id === entryId
					? {
							...entry,
							estado: "activo",
							tiempoInicio:
								entry.estado === "pausado" ? entry.tiempoInicio : new Date(),
						}
					: entry,
			),
		);
	};

	const pauseTimer = () => {
		if (activeTimer !== null) {
			setTimeEntries((entries) =>
				entries.map((entry) =>
					entry.id === activeTimer ? { ...entry, estado: "pausado" } : entry,
				),
			);
			setActiveTimer(null);
		}
	};

	const stopTimer = () => {
		if (activeTimer !== null) {
			setTimeEntries((entries) =>
				entries.map((entry) =>
					entry.id === activeTimer
						? { ...entry, estado: "completado", tiempoFin: new Date() }
						: entry,
				),
			);
			setActiveTimer(null);
			setCurrentTime(0);
		}
	};

	const addNewEntry = () => {
		const entry: TimeEntry = {
			id: Math.max(...timeEntries.map((e) => e.id)) + 1,
			tarea: newEntry.tarea,
			proyecto: newEntry.proyecto,
			descripcion: newEntry.descripcion,
			tiempoInicio: new Date(),
			duracion: 0,
			estado: "pausado",
			fecha: new Date().toISOString().split("T")[0],
		};
		setTimeEntries([...timeEntries, entry]);
		setNewEntry({ tarea: "", proyecto: "", descripcion: "" });
		setIsDialogOpen(false);
	};

	const deleteEntry = (id: number) => {
		setTimeEntries(timeEntries.filter((entry) => entry.id !== id));
		if (activeTimer === id) {
			setActiveTimer(null);
			setCurrentTime(0);
		}
	};

	const getTotalTime = () => {
		return timeEntries.reduce((total, entry) => total + entry.duracion, 0);
	};

	const getTodayTime = () => {
		const today = new Date().toISOString().split("T")[0];
		return timeEntries
			.filter((entry) => entry.fecha === today)
			.reduce((total, entry) => total + entry.duracion, 0);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "activo":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "pausado":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "completado":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
		}
	};

	return (
		<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
			<div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
				<div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
							MEDICIÓN DE TIEMPO
						</h1>
						<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
							SEGUIMIENTO DE TIEMPO EN TAREAS Y PROYECTOS
						</h2>
					</div>
					<div className="text-right">
						<div className="text-sm font-medium text-gray-600 dark:text-gray-400">
							TT1
						</div>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="grid grid-cols-3 gap-4 text-center">
						<div>
							<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
								{formatTime(getTodayTime())}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">
								Hoy
							</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-green-600 dark:text-green-400">
								{formatTime(getTotalTime())}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">
								Total
							</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
								{timeEntries.length}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">
								Entradas
							</div>
						</div>
					</div>
					<Button onClick={() => setIsDialogOpen(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Nueva Entrada
					</Button>
				</div>
			</div>

			<div className="p-4 md:p-6">
				{/* Timer activo */}
				{activeTimer !== null && (
					<Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
										<Timer className="w-6 h-6 text-white" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-900 dark:text-white">
											{timeEntries.find((e) => e.id === activeTimer)?.tarea}
										</h3>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{timeEntries.find((e) => e.id === activeTimer)?.proyecto}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<div className="text-3xl font-mono font-bold text-green-600 dark:text-green-400">
										{formatTime(
											timeEntries.find((e) => e.id === activeTimer)?.duracion ||
												0,
										)}
									</div>
									<div className="flex gap-2">
										<Button variant="outline" size="sm" onClick={pauseTimer}>
											<Pause className="w-4 h-4" />
										</Button>
										<Button variant="outline" size="sm" onClick={stopTimer}>
											<Square className="w-4 h-4" />
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Lista de entradas */}
				<div className="space-y-4">
					{timeEntries.map((entry) => (
						<Card
							key={entry.id}
							className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
						>
							<CardContent className="p-4">
								<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<h3 className="font-semibold text-gray-900 dark:text-white">
												{entry.tarea}
											</h3>
											<Badge className={getStatusColor(entry.estado)}>
												{entry.estado}
											</Badge>
										</div>
										<div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
											<div className="flex items-center gap-1">
												<Target className="w-3 h-3" />
												{entry.proyecto}
											</div>
											<div className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												{entry.fecha}
											</div>
											<div className="flex items-center gap-1">
												<Clock className="w-3 h-3" />
												{formatTime(entry.duracion)}
											</div>
										</div>
										{entry.descripcion && (
											<p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
												{entry.descripcion}
											</p>
										)}
									</div>

									<div className="flex items-center gap-2">
										<div className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
											{formatTime(entry.duracion)}
										</div>
										<div className="flex gap-1">
											{entry.estado !== "completado" && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														entry.id === activeTimer
															? pauseTimer()
															: startTimer(entry.id)
													}
												>
													{entry.id === activeTimer ? (
														<Pause className="w-4 h-4" />
													) : (
														<Play className="w-4 h-4" />
													)}
												</Button>
											)}
											<Button variant="ghost" size="sm">
												<Edit className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => deleteEntry(entry.id)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{timeEntries.length === 0 && (
					<div className="text-center py-12">
						<Timer className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
							No hay entradas de tiempo
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Comienza a rastrear tu tiempo creando una nueva entrada
						</p>
						<Button onClick={() => setIsDialogOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							Nueva Entrada
						</Button>
					</div>
				)}
			</div>

			{/* Dialog para nueva entrada */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-md mx-4 dark:bg-gray-800 dark:border-gray-700">
					<DialogHeader>
						<DialogTitle className="text-gray-900 dark:text-white">
							Nueva Entrada de Tiempo
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Tarea
							</label>
							<Input
								value={newEntry.tarea}
								onChange={(e) =>
									setNewEntry({ ...newEntry, tarea: e.target.value })
								}
								placeholder="Nombre de la tarea"
								className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Proyecto
							</label>
							<Select
								value={newEntry.proyecto}
								onValueChange={(value) =>
									setNewEntry({ ...newEntry, proyecto: value })
								}
							>
								<SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
									<SelectValue placeholder="Seleccionar proyecto" />
								</SelectTrigger>
								<SelectContent className="dark:bg-gray-800 dark:border-gray-600">
									<SelectItem value="SYSGD">SYSGD</SelectItem>
									<SelectItem value="E-commerce">E-commerce</SelectItem>
									<SelectItem value="Mobile App">Mobile App</SelectItem>
									<SelectItem value="Dashboard">Dashboard</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Descripción
							</label>
							<Textarea
								value={newEntry.descripcion}
								onChange={(e) =>
									setNewEntry({ ...newEntry, descripcion: e.target.value })
								}
								placeholder="Descripción de la tarea (opcional)"
								rows={3}
								className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
								Cancelar
							</Button>
							<Button onClick={addNewEntry}>Crear Entrada</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
