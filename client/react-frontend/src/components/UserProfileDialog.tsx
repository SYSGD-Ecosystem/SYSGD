import type React from "react";

import type { FC } from "react";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Shield, LogOut, Loader2, KeyRound, Palette } from "lucide-react";
import useCurrentUser from "../hooks/connection/useCurrentUser";
import useTheme from "../hooks/useTheme";
import ButtonSwitchTheme from "./ButtonSwitchTheme";
import { Link } from "react-router-dom";

interface UserProfileDialogProps {
	trigger?: React.ReactNode;
}

const UserProfileDialog: FC<UserProfileDialogProps> = ({ trigger }) => {
	useTheme();
	const { user, loading } = useCurrentUser();
	const [open, setOpen] = useState(false);

	const getPrivilegeColor = (privilege: string) => {
		if (privilege === null) {
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}

		switch (privilege.toLowerCase()) {
			case "admin":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "moderator":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "user":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word.charAt(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const handleLogout = async () => {
		try {
			await fetch(`${import.meta.env.VITE_SERVER_URL}/api/logout`, {
				credentials: "include",
			});
			setOpen(false); // Cerrar el dialog
			location.reload();
		} catch (error) {
			console.error("Error al cerrar sesión:", error);
		}
	};

	const handleChangePassword = () => {
		// Aquí puedes abrir otro dialog o navegar a cambio de contraseña
		console.log("Cambiar contraseña");
		setOpen(false);
	};

	// Contenido del dialog cuando está cargando
	const LoadingContent = () => (
		<div className="flex items-center justify-center p-8">
			<div className="flex items-center space-x-2">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span className="text-muted-foreground">
					Cargando datos del usuario...
				</span>
			</div>
		</div>
	);

	// Contenido del dialog cuando no hay usuario
	const NoUserContent = () => (
		<div className="text-center p-8">
			<User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
			<h3 className="text-lg font-semibold mb-2">No has iniciado sesión</h3>
			<p className="text-muted-foreground mb-4">
				Inicia sesión para ver tu perfil
			</p>
			<Button asChild onClick={() => setOpen(false)}>
				<a href="/login">Iniciar sesión</a>
			</Button>
		</div>
	);

	// Contenido principal del perfil
	const ProfileContent = () =>
		user === null ? (
			<>TU seccion caduco</>
		) : (
			<>
				<DialogHeader className="text-center pb-4">
					<div className="flex flex-col items-center space-y-4">
						<Avatar className="h-20 w-20">
							<AvatarFallback className="text-lg font-semibold bg-primary/10">
								{getInitials(user.name)}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-1">
							<DialogTitle className="text-2xl font-bold">
								{user.name}
							</DialogTitle>
							<p className="text-muted-foreground">{user.username}</p>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Shield className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Privilegios</span>
							</div>
							<Badge className={getPrivilegeColor(user.privileges)}>
								{user.privileges.charAt(0).toUpperCase() +
									user.privileges.slice(1)}
							</Badge>
						</div>

						<Separator />

						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-muted-foreground">Nombre completo</p>
								<p className="font-medium">{user.name}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Usuario</p>
								<p className="font-medium">{user.username}</p>
							</div>
						</div>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<KeyRound className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Contraseña</span>
						</div>
						<Button variant="link" onClick={handleChangePassword}>
							Cambiar
						</Button>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Palette className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Tema</span>
						</div>
						<ButtonSwitchTheme />
					</div>

					<Separator />
					{user.privileges.toLowerCase() === "admin" && (
						<Button
							variant="outline"
							className="w-full mb-2"
							asChild
							onClick={() => setOpen(false)}
						>
							<Link
								to="/admin"
								className="flex items-center justify-center gap-2"
							>
								<Shield className="h-4 w-4" />
								Administración
							</Link>
						</Button>
					)}
					<Button
						variant="destructive"
						className="w-full"
						onClick={handleLogout}
					>
						<LogOut className="h-4 w-4 mr-2" />
						Cerrar sesión
					</Button>
				</div>
			</>
		);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="ghost" size="sm" className="flex items-center gap-2">
						<User className="h-4 w-4" />
						<span className="hidden sm:inline">Perfil</span>
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-md">
				{loading ? (
					<LoadingContent />
				) : !user ? (
					<NoUserContent />
				) : (
					<ProfileContent />
				)}
			</DialogContent>
		</Dialog>
	);
};

export default UserProfileDialog;
