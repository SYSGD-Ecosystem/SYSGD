"use client";

import {
	Crown,
	Edit,
	Search,
	Shield,
	Trash2,
	User,
	UserPlus,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import Loading from "@/components/Loading";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useUsers } from "@/hooks/connection/useUsers";
import { useToast } from "@/hooks/use-toast";
import { CreateUserDialog } from "../components/admin/create-user-dialog";
import { EditUserDialog } from "../components/admin/edit-user-dialog";
import type { User as UserType } from "../types/user";

export default function AdminDashboard() {
	const { users: fetchedUsers, deleteUser, loading, refetch } = useUsers();
	const users = fetchedUsers;
	const [searchTerm, setSearchTerm] = useState("");
	const [editingUser, setEditingUser] = useState<UserType | null>(null);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
	const { toast } = useToast();

	const filteredUsers = useMemo(() => {
		return users.filter(
			(user) =>
				(user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
				(user?.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [users, searchTerm]);

	const stats = useMemo(() => {
		const totalUsers = users.length;
		const adminUsers = users.filter(
			(user) => user.privileges === "admin",
		).length;
		const regularUsers = users.filter(
			(user) => user.privileges === "user",
		).length;

		return { totalUsers, adminUsers, regularUsers };
	}, [users]);

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word.charAt(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const handleUserUpdated = (_updatedUser: UserType) => {
		// listado se refrescará vía hook
		refetch();
	};

	const handleUserCreated = (_newUser: UserType) => {
		// listado se refrescará vía hook
		refetch();
	};

	const handleDeleteUser = async () => {
		if (!userToDelete) return;

		try {
			await deleteUser(userToDelete.id);
			setDeleteDialogOpen(false);
			setUserToDelete(null);

			toast({
				title: "Usuario eliminado",
				description: `El usuario ${userToDelete.name} fue eliminado correctamente.`,
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "No se pudo eliminar el usuario. Inténtalo de nuevo.",
			});
		}
	};

	if (loading)
		return (
			<div className="flex flex-col h-screen dark:bg-slate-950 items-center justify-center">
				<Loading />
			</div>
		);

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-foreground">
							Panel de Administración
						</h1>
						<p className="text-muted-foreground">
							Gestiona todos los usuarios de la plataforma
						</p>
					</div>
					<Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
						<UserPlus className="h-4 w-4" />
						Nuevo Usuario
					</Button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total de Usuarios
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.totalUsers}</div>
							<p className="text-xs text-muted-foreground">
								usuarios registrados
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Administradores
							</CardTitle>
							<Crown className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.adminUsers}</div>
							<p className="text-xs text-muted-foreground">
								con privilegios de admin
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Usuarios Regulares
							</CardTitle>
							<User className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.regularUsers}</div>
							<p className="text-xs text-muted-foreground">usuarios estándar</p>
						</CardContent>
					</Card>
				</div>

				{/* Users Table */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Usuarios del Sistema</CardTitle>
								<CardDescription>
									Lista completa de todos los usuarios registrados
								</CardDescription>
							</div>
							<div className="relative w-72">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar usuarios..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Usuario</TableHead>
									<TableHead>Nombre de Usuario</TableHead>
									<TableHead>Privilegios</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead className="text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredUsers.map((user) => (
									<TableRow key={user.id}>
										<TableCell className="font-medium">
											<div className="flex items-center space-x-3">
												<Avatar className="h-8 w-8">
													<AvatarFallback className="bg-primary/10 text-primary text-xs">
														{getInitials(user.name || "Sin nombre")}
													</AvatarFallback>
												</Avatar>
												<span>{user.name || "Sin nombre"}</span>
											</div>
										</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>
											<Badge
												variant={
													user.privileges === "admin" ? "default" : "secondary"
												}
												className="gap-1"
											>
												{user.privileges === "admin" ? (
													<Shield className="h-3 w-3" />
												) : (
													<User className="h-3 w-3" />
												)}
												{user.privileges === "admin"
													? "Administrador"
													: "Usuario"}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													user.status === "active"
														? "default"
														: user.status === "invited"
															? "secondary"
															: user.status === "suspended"
																? "destructive"
																: user.status === "banned"
																	? "destructive"
																	: "secondary"
												}
												className="gap-1"
											>
												{user.status === "active"
													? "Activo"
													: user.status === "invited"
														? "Invitado"
														: user.status === "suspended"
															? "Suspendido"
															: user.status === "banned"
																? "Baneado"
																: "Desconocido"}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => setEditingUser(user)}
													className="gap-1"
												>
													<Edit className="h-3 w-3" />
													Editar
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setUserToDelete(user);
														setDeleteDialogOpen(true);
													}}
													className="gap-1 text-destructive hover:text-destructive"
												>
													<Trash2 className="h-3 w-3" />
													Eliminar
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{filteredUsers.length === 0 && (
							<div className="text-center py-8">
								<Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<p className="text-muted-foreground">
									No se encontraron usuarios
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Dialogs */}
				<EditUserDialog
					user={editingUser}
					open={!!editingUser}
					onOpenChange={(open) => !open && setEditingUser(null)}
					onUserUpdated={handleUserUpdated}
				/>

				<CreateUserDialog
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					onUserCreated={handleUserCreated}
				/>

				<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
							<AlertDialogDescription>
								Esta acción no se puede deshacer. El usuario{" "}
								{userToDelete?.name} será eliminado permanentemente del sistema.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleDeleteUser}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								Eliminar
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
