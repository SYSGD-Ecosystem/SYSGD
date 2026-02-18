/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useUsers } from "@/hooks/connection/useUsers";
import { useToast } from "@/hooks/use-toast";
import type { CreateUserData, User } from "../../types/user";

interface CreateUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUserCreated: (user: User) => void;
}

export function CreateUserDialog({
	open,
	onOpenChange,
	onUserCreated,
}: CreateUserDialogProps) {
	const { createUser } = useUsers();
	const [formData, setFormData] = useState<CreateUserData>({
		name: "",
		email: "",
		password: "",
		privileges: "user",
		status: "active",
		
		},);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name || !formData.email || !formData.password) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Todos los campos son obligatorios.",
			});
			return;
		}

		setLoading(true);
		try {
			const newUser = await createUser(formData as CreateUserData);

			if (newUser as User) {
				onUserCreated(newUser as User);
				onOpenChange(false);
				setFormData({
					name: "",
					email: "",
					password: "",
					privileges: "user",
					status: "active",
				});

				toast({
					title: "Usuario creado",
					description: `El usuario ${formData.name} se creó correctamente.`,
				});
			} else {
				toast({
					variant: "destructive",
					title: "Error",
					description: "No se pudo crear el usuario. Inténtalo de nuevo.",
				});
			}
		} catch {
			toast({
				variant: "destructive",
				title: "Error",
				description: "No se pudo crear el usuario. Inténtalo de nuevo.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Crear Nuevo Usuario</DialogTitle>
					<DialogDescription>
						Completa los datos para crear un nuevo usuario en el sistema.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="create-name" className="text-right">
								Nombre *
							</Label>
							<Input
								id="create-name"
								value={formData.name}
								className="col-span-3"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="create-email" className="text-right">
								Usuario *
							</Label>
							<Input
								id="create-email"
								value={formData.email}
								className="col-span-3"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, email: e.target.value }))
								}
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="create-password" className="text-right">
								Contraseña *
							</Label>
							<Input
								id="create-password"
								type="password"
								value={formData.password}
								className="col-span-3"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, password: e.target.value }))
								}
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="create-privileges" className="text-right">
								Privilegios
							</Label>
							<Select
								value={formData.privileges}
								onValueChange={(value: "user" | "admin") =>
									setFormData((prev) => ({ ...prev, privileges: value }))
								}
							>
								<SelectTrigger className="col-span-3">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="user">Usuario</SelectItem>
									<SelectItem value="admin">Administrador</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Creando..." : "Crear usuario"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
