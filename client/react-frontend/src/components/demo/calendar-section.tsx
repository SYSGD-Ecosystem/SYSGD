"use client";

import {
	ChevronLeft,
	ChevronRight,
	Clock,
	MapPin,
	Plus,
	User,
} from "lucide-react";
import { useState } from "react";
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

interface CalendarEvent {
	id: number;
	titulo: string;
	descripcion: string;
	fecha: string;
	horaInicio: string;
	horaFin: string;
	tipo: string;
	participantes: string[];
	ubicacion?: string;
	prioridad: string;
}

export function CalendarSection() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [events, setEvents] = useState<CalendarEvent[]>([
		{
			id: 1,
			titulo: "Reunión de planificación",
			descripcion: "Revisión del sprint actual y planificación del siguiente",
			fecha: "2025-07-08",
			horaInicio: "09:00",
			horaFin: "10:30",
			tipo: "Reunión",
			participantes: ["Lazaro", "Yamila", "Carlos"],
			ubicacion: "Sala de conferencias",
			prioridad: "Alta",
		},
		{
			id: 2,
			titulo: "Entrega de documentación",
			descripcion: "Fecha límite para entregar la documentación técnica",
			fecha: "2025-07-10",
			horaInicio: "17:00",
			horaFin: "17:00",
			tipo: "Deadline",
			participantes: ["Equipo completo"],
			prioridad: "Alta",
		},
		{
			id: 3,
			titulo: "Revisión de código",
			descripcion: "Sesión de code review del módulo de autenticación",
			fecha: "2025-07-12",
			horaInicio: "14:00",
			horaFin: "15:30",
			tipo: "Revisión",
			participantes: ["Lazaro", "Carlos"],
			prioridad: "Media",
		},
	]);

	const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

	const monthNames = [
		"Enero",
		"Febrero",
		"Marzo",
		"Abril",
		"Mayo",
		"Junio",
		"Julio",
		"Agosto",
		"Septiembre",
		"Octubre",
		"Noviembre",
		"Diciembre",
	];

	const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = firstDay.getDay();

		const days = [];

		// Días del mes anterior
		for (let i = startingDayOfWeek - 1; i >= 0; i--) {
			const prevDate = new Date(year, month, -i);
			days.push({ date: prevDate, isCurrentMonth: false });
		}

		// Días del mes actual
		for (let day = 1; day <= daysInMonth; day++) {
			days.push({ date: new Date(year, month, day), isCurrentMonth: true });
		}

		// Días del siguiente mes para completar la grilla
		const remainingDays = 42 - days.length;
		for (let day = 1; day <= remainingDays; day++) {
			days.push({
				date: new Date(year, month + 1, day),
				isCurrentMonth: false,
			});
		}

		return days;
	};

	const getEventsForDate = (date: Date) => {
		const dateString = date.toISOString().split("T")[0];
		return events.filter((event) => event.fecha === dateString);
	};

	const getEventTypeColor = (type: string) => {
		switch (type) {
			case "Reunión":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "Deadline":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "Revisión":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "Tarea":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
		}
	};

	const navigateMonth = (direction: "prev" | "next") => {
		setCurrentDate((prev) => {
			const newDate = new Date(prev);
			if (direction === "prev") {
				newDate.setMonth(prev.getMonth() - 1);
			} else {
				newDate.setMonth(prev.getMonth() + 1);
			}
			return newDate;
		});
	};

	const handleAddEvent = () => {
		const newEvent: CalendarEvent = {
			id: Math.max(...events.map((e) => e.id)) + 1,
			titulo: "",
			descripcion: "",
			fecha: selectedDate
				? selectedDate.toISOString().split("T")[0]
				: new Date().toISOString().split("T")[0],
			horaInicio: "09:00",
			horaFin: "10:00",
			tipo: "Reunión",
			participantes: [],
			prioridad: "Media",
		};
		setEditingEvent(newEvent);
		setIsDialogOpen(true);
	};

	const handleSaveEvent = () => {
		if (editingEvent) {
			if (events.find((e) => e.id === editingEvent.id)) {
				setEvents(
					events.map((event) =>
						event.id === editingEvent.id ? editingEvent : event,
					),
				);
			} else {
				setEvents([...events, editingEvent]);
			}
			setEditingEvent(null);
			setIsDialogOpen(false);
		}
	};

	const days = getDaysInMonth(currentDate);
	const today = new Date();

	return (
		<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
			<div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
				<div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
							CALENDARIO DEL PROYECTO
						</h1>
						<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
							GESTIÓN DE EVENTOS Y FECHAS IMPORTANTES
						</h2>
					</div>
					<div className="text-right">
						<div className="text-sm font-medium text-gray-600 dark:text-gray-400">
							CAL1
						</div>
					</div>
				</div>

				<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigateMonth("prev")}
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">
								{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
							</h3>
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigateMonth("next")}
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>

						<div className="flex gap-1">
							{(["month", "week", "day"] as const).map((mode) => (
								<Button
									key={mode}
									variant={viewMode === mode ? "default" : "outline"}
									size="sm"
									onClick={() => setViewMode(mode)}
								>
									{mode === "month"
										? "Mes"
										: mode === "week"
											? "Semana"
											: "Día"}
								</Button>
							))}
						</div>
					</div>

					<Button onClick={handleAddEvent} className="w-full sm:w-auto">
						<Plus className="w-4 h-4 mr-2" />
						Nuevo Evento
					</Button>
				</div>
			</div>

			<div className="p-4 md:p-6">
				{viewMode === "month" && (
					<div className="grid grid-cols-7 gap-1">
						{dayNames.map((day) => (
							<div
								key={day}
								className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
							>
								{day}
							</div>
						))}

						{days.map((day, index) => {
							const dayEvents = getEventsForDate(day.date);
							const isToday = day.date.toDateString() === today.toDateString();
							const isSelected =
								selectedDate?.toDateString() === day.date.toDateString();

							return (
								// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									key={index}
									className={`
                  min-h-[80px] md:min-h-[100px] p-1 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800
                  ${!day.isCurrentMonth ? "bg-gray-50 dark:bg-gray-800 text-gray-400" : "bg-white dark:bg-gray-900"}
                  ${isToday ? "ring-2 ring-blue-500" : ""}
                  ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                `}
									onClick={() => setSelectedDate(day.date)}
								>
									<div
										className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}
									>
										{day.date.getDate()}
									</div>
									<div className="space-y-1">
										{dayEvents.slice(0, 2).map((event) => (
											<div
												key={event.id}
												className={`text-xs p-1 rounded truncate ${getEventTypeColor(event.tipo)}`}
												title={event.titulo}
											>
												{event.titulo}
											</div>
										))}
										{dayEvents.length > 2 && (
											<div className="text-xs text-gray-500 dark:text-gray-400">
												+{dayEvents.length - 2} más
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{selectedDate && (
					<div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							Eventos para{" "}
							{selectedDate.toLocaleDateString("es-ES", {
								weekday: "long",
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</h3>

						<div className="space-y-3">
							{getEventsForDate(selectedDate).map((event) => (
								<Card
									key={event.id}
									className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
								>
									<CardContent className="p-4">
										<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
													<h4 className="font-medium text-gray-900 dark:text-white truncate">
														{event.titulo}
													</h4>
													<Badge className={getEventTypeColor(event.tipo)}>
														{event.tipo}
													</Badge>
												</div>

												<p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
													{event.descripcion}
												</p>

												<div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
													<div className="flex items-center gap-1">
														<Clock className="w-3 h-3 flex-shrink-0" />
														{event.horaInicio} - {event.horaFin}
													</div>
													<div className="flex items-center gap-1">
														<User className="w-3 h-3 flex-shrink-0" />
														<span className="truncate">
															{event.participantes.join(", ")}
														</span>
													</div>
													{event.ubicacion && (
														<div className="flex items-center gap-1">
															<MapPin className="w-3 h-3 flex-shrink-0" />
															<span className="truncate">
																{event.ubicacion}
															</span>
														</div>
													)}
												</div>
											</div>

											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													setEditingEvent(event);
													setIsDialogOpen(true);
												}}
												className="self-start"
											>
												Editar
											</Button>
										</div>
									</CardContent>
								</Card>
							))}

							{getEventsForDate(selectedDate).length === 0 && (
								<p className="text-gray-500 dark:text-gray-400 text-center py-8">
									No hay eventos programados para esta fecha
								</p>
							)}
						</div>
					</div>
				)}
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-md mx-4 dark:bg-gray-800 dark:border-gray-700">
					<DialogHeader>
						<DialogTitle className="text-gray-900 dark:text-white">
							{editingEvent?.id && events.find((e) => e.id === editingEvent.id)
								? "Editar Evento"
								: "Nuevo Evento"}
						</DialogTitle>
					</DialogHeader>
					{editingEvent && (
						<div className="space-y-4">
							<div>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Título
								</label>
								<Input
									value={editingEvent.titulo}
									onChange={(e) =>
										setEditingEvent({ ...editingEvent, titulo: e.target.value })
									}
									placeholder="Título del evento"
									className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								/>
							</div>

							<div>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Descripción
								</label>
								<Textarea
									value={editingEvent.descripcion}
									onChange={(e) =>
										setEditingEvent({
											...editingEvent,
											descripcion: e.target.value,
										})
									}
									placeholder="Descripción del evento"
									rows={3}
									className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Fecha
									</label>
									<Input
										type="date"
										value={editingEvent.fecha}
										onChange={(e) =>
											setEditingEvent({
												...editingEvent,
												fecha: e.target.value,
											})
										}
										className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									/>
								</div>
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Tipo
									</label>
									<Select
										value={editingEvent.tipo}
										onValueChange={(value) =>
											setEditingEvent({ ...editingEvent, tipo: value })
										}
									>
										<SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="dark:bg-gray-800 dark:border-gray-600">
											<SelectItem value="Reunión">Reunión</SelectItem>
											<SelectItem value="Deadline">Deadline</SelectItem>
											<SelectItem value="Revisión">Revisión</SelectItem>
											<SelectItem value="Tarea">Tarea</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Hora inicio
									</label>
									<Input
										type="time"
										value={editingEvent.horaInicio}
										onChange={(e) =>
											setEditingEvent({
												...editingEvent,
												horaInicio: e.target.value,
											})
										}
										className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									/>
								</div>
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Hora fin
									</label>
									<Input
										type="time"
										value={editingEvent.horaFin}
										onChange={(e) =>
											setEditingEvent({
												...editingEvent,
												horaFin: e.target.value,
											})
										}
										className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									/>
								</div>
							</div>

							<div>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Ubicación
								</label>
								<Input
									value={editingEvent.ubicacion || ""}
									onChange={(e) =>
										setEditingEvent({
											...editingEvent,
											ubicacion: e.target.value,
										})
									}
									placeholder="Ubicación del evento"
									className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								/>
							</div>

							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button onClick={handleSaveEvent}>Guardar</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
