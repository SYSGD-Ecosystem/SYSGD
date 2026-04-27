import { ChevronDown, User } from "lucide-react";
import { type FC, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import useCurrentUser from "../hooks/connection/useCurrentUser";
import useServerStatus from "@/hooks/connection/useServerStatus";
import UserProfileDialog from "./UserProfileDialog";

// Componente para usar como trigger personalizado en el header
const UserProfileTrigger: FC = () => {
	const { user, loading } = useCurrentUser();
	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
	const { status, checkServerStatus } = useServerStatus(serverUrl);

	useEffect(() => {
		checkServerStatus();
		const intervalId = window.setInterval(() => {
			void checkServerStatus();
		}, 30000);

		return () => window.clearInterval(intervalId);
	}, [checkServerStatus]);

	if (loading) {
		return (
			<Button variant="ghost" size="sm" disabled>
				<User className="h-4 w-4 animate-pulse" />
			</Button>
		);
	}

	if (!user) {
		return (
			<UserProfileDialog
				trigger={
					<Button variant="ghost" size="sm">
						<User className="h-4 w-4" />
						<span className="hidden sm:inline ml-2">Iniciar sesión</span>
					</Button>
				}
			/>
		);
	}

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word.charAt(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<UserProfileDialog
			trigger={
				<Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
					<div className="relative">
						<Avatar className="h-8 w-8">
							<AvatarFallback className="text-xs bg-primary/10">
								{getInitials(user.name)}
							</AvatarFallback>
						</Avatar>
						<span
							className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${
								status === "online"
									? "bg-green-500"
									: status === "offline"
										? "bg-red-500"
										: "bg-yellow-500"
							}`}
							title={
								status === "online"
									? "Conectado"
									: status === "offline"
										? "Offline"
										: "Verificando..."
							}
						/>
					</div>
					<div className="hidden sm:block text-left">
						<p className="text-sm font-medium leading-none">{user.name}</p>
						<p className="text-xs text-muted-foreground">{user.email}</p>
					</div>
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				</Button>
			}
		/>
	);
};

export default UserProfileTrigger;
