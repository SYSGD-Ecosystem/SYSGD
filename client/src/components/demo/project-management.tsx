import { AlertCircle, CheckCircle, Clock, Plus, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export function ProjectManagement() {
	const tasks = [
		{
			id: 1,
			fecha: "05/07/2025",
			tipo: "Tarea",
			prioridad: "Alta",
			titulo: "Implementar sistema de autenticación",
			estado: "En Progreso",
			asignado: "Lazaro",
		},
		{
			id: 2,
			fecha: "06/07/2025",
			tipo: "Idea",
			prioridad: "Media",
			titulo: "Mejorar interfaz de usuario",
			estado: "Pendiente",
			asignado: "Yamila",
		},
		{
			id: 3,
			fecha: "07/07/2025",
			tipo: "Nota",
			prioridad: "Baja",
			titulo: "Reunión con cliente programada",
			estado: "Completado",
			asignado: "Equipo",
		},
	];

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "Completado":
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case "En Progreso":
				return <Clock className="w-4 h-4 text-blue-500" />;
			case "Pendiente":
				return <AlertCircle className="w-4 h-4 text-yellow-500" />;
			default:
				return null;
		}
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

	return (
		<div className="bg-white rounded-lg shadow-sm">
			<div className="p-6 border-b border-gray-200">
				<div className="flex justify-between items-start mb-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 mb-2">
							GESTIÓN DE PROYECTOS
						</h1>
						<h2 className="text-lg font-semibold text-gray-700 mb-4">
							REGISTRO DE TAREAS Y ACTIVIDADES
						</h2>
					</div>
					<div className="text-right">
						<div className="text-sm font-medium">GP1</div>
					</div>
				</div>

				<div className="space-y-2 text-sm text-gray-600 mb-6">
					<div>
						<span className="font-medium">PROYECTO:</span> Sistema de Gestión
						Documental
					</div>
					<div>
						<span className="font-medium">RESPONSABLE:</span> FUNCIONARIO -
						LAZARO
					</div>
				</div>
			</div>

			<div className="p-6">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="text-center">ID</TableHead>
							<TableHead className="text-center">FECHA</TableHead>
							<TableHead className="text-center">TIPO</TableHead>
							<TableHead className="text-center">PRIORIDAD</TableHead>
							<TableHead className="text-center">TÍTULO</TableHead>
							<TableHead className="text-center">ESTADO</TableHead>
							<TableHead className="text-center">ASIGNADO</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{tasks.map((task) => (
							<TableRow key={task.id}>
								<TableCell className="text-center">{task.id}</TableCell>
								<TableCell className="text-center">{task.fecha}</TableCell>
								<TableCell className="text-center">{task.tipo}</TableCell>
								<TableCell className="text-center">
									<Badge variant={getPriorityColor(task.prioridad)}>
										{task.prioridad}
									</Badge>
								</TableCell>
								<TableCell className="text-center">{task.titulo}</TableCell>
								<TableCell className="text-center">
									<div className="flex items-center justify-center gap-2">
										{getStatusIcon(task.estado)}
										{task.estado}
									</div>
								</TableCell>
								<TableCell className="text-center">{task.asignado}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				<div className="flex gap-2 mt-6">
					<Button variant="outline" size="sm">
						<Plus className="w-4 h-4 mr-2" />
						Nueva Tarea
					</Button>
					<Button size="sm">
						<Save className="w-4 h-4 mr-2" />
						Guardar
					</Button>
				</div>
			</div>
		</div>
	);
}
