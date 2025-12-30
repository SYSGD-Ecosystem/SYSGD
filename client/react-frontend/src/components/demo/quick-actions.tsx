"use client";

import {
	BarChart3,
	Calendar,
	FileText,
	FolderPlus,
	Settings,
	Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function QuickActions() {
	const actions = [
		{
			icon: FolderPlus,
			title: "Nuevo Proyecto",
			description: "Crear un nuevo proyecto de gestión",
			color: "bg-blue-500",
			action: () => console.log("Nuevo proyecto"),
		},
		{
			icon: FileText,
			title: "Nuevo Documento",
			description: "Crear archivo de gestión documental",
			color: "bg-green-500",
			action: () => console.log("Nuevo documento"),
		},
		{
			icon: Users,
			title: "Gestionar Equipo",
			description: "Administrar miembros del equipo",
			color: "bg-purple-500",
			action: () => console.log("Gestionar equipo"),
		},
		{
			icon: Calendar,
			title: "Programar Evento",
			description: "Añadir evento al calendario",
			color: "bg-orange-500",
			action: () => console.log("Programar evento"),
		},
		{
			icon: BarChart3,
			title: "Ver Reportes",
			description: "Consultar métricas y estadísticas",
			color: "bg-indigo-500",
			action: () => console.log("Ver reportes"),
		},
		{
			icon: Settings,
			title: "Configuración",
			description: "Ajustar preferencias del sistema",
			color: "bg-gray-500",
			action: () => console.log("Configuración"),
		},
	];

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
			{actions.map((action, index) => {
				const Icon = action.icon;
				return (
					<Card
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						key={index}
						className="hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700"
						onClick={action.action}
					>
						<CardContent className="p-4 text-center">
							<div
								className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}
							>
								<Icon className="w-6 h-6 text-white" />
							</div>
							<h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
								{action.title}
							</h3>
							<p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
								{action.description}
							</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
