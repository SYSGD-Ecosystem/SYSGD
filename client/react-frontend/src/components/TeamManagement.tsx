import { type FC, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Plus, Mail } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { useProjectMembers } from "@/hooks/connection/useProjectMembers";
import type { Member } from "@/types/Member";
import DialogInvite from "./dialogs/DialogInvite";
import { Skeleton } from "./TaskManagement";

const TeamManagement: FC<{ projectId: string }> = ({ projectId }) => {
	const { members, loading } = useProjectMembers(projectId);

	const [teamMembers, setTeamMembers] = useState<Member[]>(members);
	const [isDialogInviteOpen, setIsDialogInviteOpen] = useState(false);
	const [editingMember, setEditingMember] = useState<Member | null>(null);
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

	const handleEditMember = (member: Member) => {
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

	useEffect(() => {
		setTeamMembers(members);
	}, [members]);

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
					<Button
						onClick={() => {
							setIsDialogInviteOpen(true);
						}}
					>
						<Plus className="w-4 h-4 mr-2" />
						Agregar Miembro
					</Button>
				</div>
			</div>

			<div className="p-4 md:p-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
					{loading ? (
						<>
							<SkeletonCardMembers />
							<SkeletonCardMembers />
							<SkeletonCardMembers />
							<SkeletonCardMembers />
						</>
					) : (
						<>
							{teamMembers.map((member) => (
								<Card
									key={member.id}
									className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
								>
									<CardHeader className="pb-4">
										<div className="flex items-start gap-4">
											<Avatar className="w-12 h-12">
												<AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold">
													{getInitials(member.name)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<CardTitle className="text-lg text-gray-900 dark:text-white truncate">
													{member.name}
												</CardTitle>
												<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
													{member.role}
												</p>
												{member.estado !== undefined ? (
													<Badge variant={getStatusColor(member.estado)}>
														{member.estado}
													</Badge>
												) : (
													<></>
												)}
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
												<span className="truncate">{member.username}</span>
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

										<div className="gap-2 hidden">
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
						</>
					)}
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
								<div>
									<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Email
									</Label>
									<Input
										type="email"
										value={editingMember.username}
										onChange={(e) =>
											setEditingMember({
												...editingMember,
												username: e.target.value,
											})
										}
										placeholder="correo@ejemplo.com"
										className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
									/>
								</div>
								<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Rol
								</Label>
								<Input
									value={editingMember.role}
									onChange={(e) =>
										setEditingMember({ ...editingMember, role: e.target.value })
									}
									placeholder="Rol en el equipo"
									className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Estado
									</Label>
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
			<DialogInvite
				projectId={projectId}
				isOpen={isDialogInviteOpen}
				onOpenChange={setIsDialogInviteOpen}
			/>
		</div>
	);
};

const SkeletonCardMembers: FC = () => {
	return (
		<Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
			<CardHeader className="pb-4">
				<div className="flex items-center gap-4">
					<Avatar className="w-12 h-12">
						<div className="w-11 h-11 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" />
					</Avatar>
					<div className="flex-1 min-w-0">
						<CardTitle className="text-lg text-gray-900 dark:text-white truncate">
							<Skeleton />
						</CardTitle>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
						<Skeleton />
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<Skeleton />
					</div>
					<Skeleton />
				</div>
			</CardContent>
		</Card>
	);
};
export default TeamManagement;
