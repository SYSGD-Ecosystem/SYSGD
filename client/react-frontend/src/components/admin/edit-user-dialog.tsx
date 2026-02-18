/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
import {
	DEFAULT_BILLING_LIMITS,
	normalizeUser,
	type UpdateUserData,
	type User,
} from "../../types/user";

interface EditUserDialogProps {
	user: User | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUserUpdated: (user: User) => void;
}

export function EditUserDialog({
	user,
	open,
	onOpenChange,
	onUserUpdated,
}: EditUserDialogProps) {
	const { updateUser } = useUsers();
	const [formData, setFormData] = useState<UpdateUserData>({});
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	// Reset form when user changes
	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name,
				email: user.email,
				privileges: user.privileges,
				status: user.status,
			});
		}
	}, [user]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		setLoading(true);
		try {
			// Solo enviar campos que cambiaron
			const updates: UpdateUserData = {};
			if (formData.name && formData.name !== user.name) {
				updates.name = formData.name;
			}
			if (formData.email && formData.email !== user.email) {
				updates.email = formData.email;
			}
			if (formData.password) {
				updates.password = formData.password;
			}
			if (formData.privileges && formData.privileges !== user.privileges) {
				updates.privileges = formData.privileges;
			}
			if (formData.status && formData.status !== user.status) {
				updates.status = formData.status;
			}
			if (
				formData.user_data?.billing?.tier &&
				formData.user_data.billing.tier !== user.user_data?.billing?.tier
			) {
				updates.user_data = {
					billing: {
						tier: formData.user_data.billing.tier,
						ai_task_credits: user.user_data?.billing?.ai_task_credits || 0,
						purchased_credits: user.user_data?.billing?.purchased_credits || 0,
						limits: user.user_data?.billing?.limits || {
							max_ai_task_credits: 0,
							max_projects: 0,
							priority_support: false,
						},
						billing_cycle: user.user_data?.billing?.billing_cycle || {
							last_reset: new Date().toISOString(),
							next_reset: new Date().toISOString(),
						},
					},
				};
			}

			if (Object.keys(updates).length === 0) {
				toast({
					title: "Sin cambios",
					description: "No se detectaron cambios en los datos del usuario.",
				});
				setLoading(false);
				return;
			}

			await updateUser(user.id, updates);

			onUserUpdated(
				normalizeUser({
					...user,
					...updates,
				}),
			);
			onOpenChange(false);

			toast({
				title: "Usuario actualizado",
				description: `Los datos de ${user.name} se actualizaron correctamente.`,
			});
		} catch (error) {
			console.error("Error:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description: "No se pudo actualizar el usuario. Inténtalo de nuevo.",
			});
		} finally {
			setLoading(false);
		}
	};

	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Editar Usuario</DialogTitle>
					<DialogDescription>
						Modifica los datos del usuario {user.name}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-name" className="text-right">
								Nombre
							</Label>
							<Input
								id="edit-name"
								value={formData.name || ""}
								className="col-span-3"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-email" className="text-right">
								Email
							</Label>
							<Input
								id="edit-email"
								type="email"
								value={formData.email || ""}
								className="col-span-3"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, email: e.target.value }))
								}
							/>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-password" className="text-right">
								Contraseña
							</Label>
							<Input
								id="edit-password"
								type="password"
								placeholder="Dejar vacío para mantener actual"
								className="col-span-3"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, password: e.target.value }))
								}
							/>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-privileges" className="text-right">
								Privilegios
							</Label>
							<Select
								value={formData.privileges || user.privileges}
								onValueChange={(value: "user" | "admin") =>
									setFormData((prev) => ({ ...prev, privileges: value }))
								}
							>
								<SelectTrigger id="edit-privileges" className="col-span-3">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="user">Usuario</SelectItem>
									<SelectItem value="admin">Administrador</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-status" className="text-right">
								Estado
							</Label>
							<Select
								value={formData.status || user.status || "active"}
								onValueChange={(
									value: "active" | "invited" | "suspended" | "banned",
								) => setFormData((prev) => ({ ...prev, status: value }))}
							>
								<SelectTrigger id="edit-status" className="col-span-3">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Activo</SelectItem>
									<SelectItem value="invited">Invitado</SelectItem>
									<SelectItem value="suspended">Suspendido</SelectItem>
									<SelectItem value="banned">Baneado</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-tier" className="text-right">
								Plan
							</Label>
							<Select
								value={
									formData.user_data?.billing?.tier ||
									user.user_data?.billing?.tier ||
									"free"
								}
								onValueChange={
									(value: "free" | "pro" | "vip") => {
										setFormData((prev) => ({
											...prev,
											user_data: {
												ai_task_credits:
													(prev.user_data?.billing?.ai_task_credits ??
														user.user_data?.billing?.ai_task_credits ??
														0) +
														value ===
													"free"
														? 5
														: value === "pro"
															? 50
															: value === "vip"
																? 200
																: 0,
												purchased_credits:
													prev.user_data?.billing?.purchased_credits ??
													user.user_data?.billing?.purchased_credits ??
													0,
												billing: {
													tier: value,
													ai_task_credits:
														prev.user_data?.billing?.ai_task_credits ??
														0,
													purchased_credits:
														prev.user_data?.billing?.purchased_credits ??
														0,
													limits:
														prev.user_data?.billing?.limits ??
														DEFAULT_BILLING_LIMITS[
															prev.user_data?.billing?.tier ?? "free"
														],
													billing_cycle:
														
														user.user_data?.billing?.billing_cycle || {
															last_reset: new Date().toISOString(),
															next_reset: new Date().toISOString(),
														},
													},
											},
										}));
											}
									//   setFormData((prev) => ({
									//     ...prev,
									//     user_data: {
									//       ...prev.user_data,
									//       billing: {
									//         ...(prev.user_data?.billing || {}),
									//         tier: value,
									//       },
									//     },
									//   }))
								}
							>
								<SelectTrigger id="edit-tier" className="col-span-3">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="free">Free</SelectItem>
									<SelectItem value="pro">Pro</SelectItem>
									<SelectItem value="vip">VIP</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Mostrar créditos actuales */}
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right text-sm text-muted-foreground">
								Créditos
							</Label>
							<div className="col-span-3 text-sm">
								{user.user_data?.billing?.ai_task_credits || 0} disponibles
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Guardando..." : "Guardar cambios"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
