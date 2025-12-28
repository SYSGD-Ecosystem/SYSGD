"use client";

import { Calendar, Mail, MapPin, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface TeamMember {
	id: number;
	nombre: string;
	rol: string;
	email: string;
	telefono: string;
	ubicacion: string;
	fechaIngreso: string;
	tareasAsignadas: number;
	tareasCompletadas: number;
	estado: string;
}

export function TeamManagement() {
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
		{
			id: 1,
			nombre: "Lazaro Yunier Salazar Rodriguez",
			rol: "Líder de Proyecto",
			email: "lazaroyunier96@gmail.com",
			telefono: "+53 5555-0123",
			ubicacion: "La Habana, Cuba",
			fechaIngreso: "01/01/2024",
			tareasAsignadas: 8,
			tareasCompletadas: 5,
			estado: "Activo",
		},
		{
			id: 2,
			nombre: "Yamila García Pérez",
			rol: "Desarrolladora Frontend",
			email: "yamila.garcia@email.com",
			telefono: "+53 5555-0124",
			ubicacion: "La Habana, Cuba",
			fechaIngreso: "15/02/2024",
			tareasAsignadas: 6,
			tareasCompletadas: 4,
			estado: "Activo",
		},
		{
			id: 3,
			nombre: "Carlos Rodríguez Mesa",
			rol: "Desarrollador Backend",
			email: "carlos.rodriguez@email.com",
			telefono: "+53 5555-0125",
			ubicacion: "Santiago, Cuba",
			fechaIngreso: "01/03/2024",
			tareasAsignadas: 5,
			tareasCompletadas: 3,
			estado: "Activo",
		},
		{
			id: 4,
			nombre: "María Elena Fernández",
			rol: "Diseñadora UX/UI",
			email: "maria.fernandez@email.com",
			telefono: "+53 5555-0126",
			ubicacion: "Matanzas, Cuba",
			fechaIngreso: "10/04/2024",
			tareasAsignadas: 4,
			tareasCompletadas: 2,
			estado: "Vacaciones",
		},
	]);

	const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.substring(0, 2)
			.toUpperCase();
	};

	const getProgressPercentage = (completed: number, total: number) => {
		return total > 0 ? (completed / total) * 100 : 0;
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Activo":
				return "default";
			case "Vacaciones":
				return "secondary";
			case "Inactivo":
				return "destructive";
			default:
				return "default";
		}
	};

	const handleAddMember = () => {
		const newMember: TeamMember = {
			id: Math.max(...teamMembers.map((m) => m.id)) + 1,
			nombre: "",
			rol: "",
			email: "",
			telefono: "",
			ubicacion: "",
			fechaIngreso: new Date().toLocaleDateString("es-ES"),
			tareasAsignadas: 0,
			tareasCompletadas: 0,
			estado: "Activo",
		};
		setEditingMember(newMember);
		setIsDialogOpen(true);
	};

	const handleEditMember = (member: TeamMember) => {
		setEditingMember(member);
		setIsDialogOpen(true);
	};

	const handleSaveMember = () => {
		if (editingMember) {
			if (teamMembers.find((m) => m.id === editingMember.id)) {
				setTeamMembers(
					teamMembers.map((member) =>
						member.id === editingMember.id ? editingMember : member,
					),
				);
			} else {
				setTeamMembers([...teamMembers, editingMember]);
			}
			setEditingMember(null);
			setIsDialogOpen(false);
		}
	};

	const handleDeleteMember = (memberId: number) => {
		setTeamMembers(teamMembers.filter((member) => member.id !== memberId));
	};

	return (
		<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
			<div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
				<div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
							EQUIPO DE TRABAJO
						</h1>
						<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
							GESTIÓN DE MIEMBROS DEL EQUIPO
						</h2>
					</div>
					<div className="text-right">
						<div className="text-sm font-medium text-gray-600 dark:text-gray-400">
							ET1
						</div>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="text-sm text-gray-600 dark:text-gray-400">
						<span className="font-medium">Total de miembros:</span>{" "}
						{teamMembers.length}
					</div>
					<Button onClick={handleAddMember}>
						<Plus className="w-4 h-4 mr-2" />
						Agregar Miembro
					</Button>
				</div>
			</div>

			<div className="p-4 md:p-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
					{teamMembers.map((member) => (
						<Card
							key={member.id}
							className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
						>
							<CardHeader className="pb-4">
								<div className="flex items-start gap-4">
									<Avatar className="w-12 h-12">
										<AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold">
											{getInitials(member.nombre)}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<CardTitle className="text-lg text-gray-900 dark:text-white truncate">
											{member.nombre}
										</CardTitle>
										<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
											{member.rol}
										</p>
										<Badge variant={getStatusColor(member.estado)}>
											{member.estado}
										</Badge>
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEditMember(member)}
										>
											{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
											<svg
												className="w-3 h-3"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteMember(member.id)}
										>
											{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
											<svg
												className="w-3 h-3"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
										<Mail className="w-4 h-4 flex-shrink-0" />
										<span className="truncate">{member.email}</span>
									</div>
									<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
										<Phone className="w-4 h-4 flex-shrink-0" />
										{member.telefono}
									</div>
									<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
										<MapPin className="w-4 h-4 flex-shrink-0" />
										<span className="truncate">{member.ubicacion}</span>
									</div>
									<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
										<Calendar className="w-4 h-4 flex-shrink-0" />
										Desde: {member.fechaIngreso}
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-gray-700 dark:text-gray-300">
											Progreso de tareas
										</span>
										<span className="text-gray-600 dark:text-gray-400">
											{member.tareasCompletadas}/{member.tareasAsignadas}
										</span>
									</div>
									<Progress
										value={getProgressPercentage(
											member.tareasCompletadas,
											member.tareasAsignadas,
										)}
										className="h-2"
									/>
								</div>

								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1 bg-transparent"
									>
										Ver Perfil
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="flex-1 bg-transparent"
									>
										Asignar Tarea
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-md mx-4">
					<DialogHeader>
						<DialogTitle className="text-gray-900 dark:text-white">
							{editingMember?.id &&
							teamMembers.find((m) => m.id === editingMember.id)
								? "Editar Miembro"
								: "Nuevo Miembro"}
						</DialogTitle>
					</DialogHeader>
					{editingMember && (
						<div className="space-y-4">
							<div>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Nombre completo
								</label>
								<Input
									value={editingMember.nombre}
									onChange={(e) =>
										setEditingMember({
											...editingMember,
											nombre: e.target.value,
										})
									}
									placeholder="Nombre completo"
									className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
								/>
							</div>
							<div>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Rol
								</label>
								<Input
									value={editingMember.rol}
									onChange={(e) =>
										setEditingMember({ ...editingMember, rol: e.target.value })
									}
									placeholder="Rol en el equipo"
									className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
								/>
							</div>
							<div>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Email
								</label>
								<Input
									type="email"
									value={editingMember.email}
									onChange={(e) =>
										setEditingMember({
											...editingMember,
											email: e.target.value,
										})
									}
									placeholder="correo@ejemplo.com"
									className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Teléfono
									</label>
									<Input
										value={editingMember.telefono}
										onChange={(e) =>
											setEditingMember({
												...editingMember,
												telefono: e.target.value,
											})
										}
										placeholder="+53 5555-0000"
										className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
									/>
								</div>
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Estado
									</label>
									<select
										value={editingMember.estado}
										onChange={(e) =>
											setEditingMember({
												...editingMember,
												estado: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-white"
									>
										<option value="Activo">Activo</option>
										<option value="Vacaciones">Vacaciones</option>
										<option value="Inactivo">Inactivo</option>
									</select>
								</div>
							</div>
							<div>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Ubicación
								</label>
								<Input
									value={editingMember.ubicacion}
									onChange={(e) =>
										setEditingMember({
											...editingMember,
											ubicacion: e.target.value,
										})
									}
									placeholder="Ciudad, País"
									className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
								/>
							</div>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button onClick={handleSaveMember}>Guardar</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
