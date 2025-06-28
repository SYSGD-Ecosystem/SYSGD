import type { FC } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Shield, LogOut, Loader2, KeyRound } from "lucide-react";
import useCurrentUser from "../hooks/connection/useCurrentUser";
import useTheme from "../hooks/useTheme";

// Simulando el hook para el ejemplo

const UserProfile: FC = () => {
	useTheme();
	const { user, loading } = useCurrentUser();

	if (loading) {
		return (
			<Card className="w-full max-w-md mx-auto">
				<CardContent className="flex items-center justify-center p-8">
					<div className="flex items-center space-x-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span className="text-muted-foreground">
							Cargando datos del usuario...
						</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!user) {
		return (
			<Card className="w-full max-w-md mx-auto">
				<CardContent className="text-center p-8">
					<User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
					<h3 className="text-lg font-semibold mb-2">No has iniciado sesión</h3>
					<p className="text-muted-foreground mb-4">
						Inicia sesión para ver tu perfil
					</p>
					<Button asChild>
						<a href="/login">Iniciar sesión</a>
					</Button>
				</CardContent>
			</Card>
		);
	}

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
			await fetch(`${import.meta.env.VITE_SERVER_URL}/logout`, {
				credentials: "include",
			});
			location.reload();
		} catch (error) {
			console.error("Error al cerrar sesión:", error);
		}
	};
	console.log("Realizando");
	return (
		<div className="flex h-screen items-center justify-center">
			<Card className="w-full max-w-md mx-auto">
				<CardHeader className="text-center pb-4">
					<div className="flex flex-col items-center space-y-4">
						<Avatar className="h-20 w-20">
							<AvatarFallback className="text-lg font-semibold bg-primary/10">
								{getInitials(user.name)}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-1">
							<h2 className="text-2xl font-bold">{user.name}</h2>
							<p className="text-muted-foreground">{user.username}</p>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-6">
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
						<Button variant="link">Cambiar</Button>
					</div>
					<Separator />

					<Button
						variant="destructive"
						className="w-full"
						onClick={handleLogout}
					>
						<LogOut className="h-4 w-4 mr-2" />
						Cerrar sesión
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};

export default UserProfile;
