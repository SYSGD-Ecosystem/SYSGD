"use client";

import { Bell, MessageSquare, UserPlus, Users, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useChatContext } from "../hooks/useChatContext";
import type { Conversation } from "../hooks/useChat";
import { useToast } from "@/hooks/use-toast";

interface ChatSettingsProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	chat: Conversation;
}

export function ChatSettings({ open, onOpenChange, chat }: ChatSettingsProps) {
	const [soundEnabled, setSoundEnabled] = useState(true);
	const [sendSoundEnabled, setSendSoundEnabled] = useState(true);
	const [receiveSoundEnabled, setReceiveSoundEnabled] = useState(true);
	const [volume, setVolume] = useState([80]);
	const [notifications, setNotifications] = useState(true);
	const [title, setTitle] = useState(chat.title ?? "");
	const [memberEmail, setMemberEmail] = useState("");
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const { toast } = useToast();
	const {
		updateConversationTitle,
		addConversationMember,
		removeConversationMember,
		fetchCurrentUser,
	} = useChatContext();

	useEffect(() => {
		if (!open) return;
		setTitle(chat.title ?? "");
		setMemberEmail("");
		fetchCurrentUser().then((user) => setCurrentUserId(user?.id ?? null));
	}, [open, chat.title, fetchCurrentUser]);

	const canManage = useMemo(() => {
		if (!currentUserId) return false;
		const isAdmin =
			chat.members?.some(
				(member) => member.id === currentUserId && member.role === "admin",
			) ?? false;
		const isCreator = chat.created_by === currentUserId;
		return isAdmin || isCreator;
	}, [chat.members, chat.created_by, currentUserId]);

	const handleSaveTitle = async () => {
		if (!canManage) return;
		setSaving(true);
		try {
			await updateConversationTitle(chat.id, title.trim() || null);
			toast({ title: "Nombre actualizado" });
		} catch (err: any) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err?.response?.data?.error ||
					err?.message ||
					"No se pudo actualizar el nombre",
			});
		} finally {
			setSaving(false);
		}
	};

	const handleAddMember = async () => {
		if (!canManage || !memberEmail.trim()) return;
		setSaving(true);
		try {
			await addConversationMember(chat.id, memberEmail.trim());
			setMemberEmail("");
			toast({ title: "Miembro añadido" });
		} catch (err: any) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err?.response?.data?.error ||
					err?.message ||
					"No se pudo añadir miembro",
			});
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveMember = async (userId: string) => {
		if (!canManage && userId !== currentUserId) return;
		setSaving(true);
		try {
			await removeConversationMember(chat.id, userId);
			toast({ title: "Miembro eliminado" });
		} catch (err: any) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					err?.response?.data?.error ||
					err?.message ||
					"No se pudo eliminar miembro",
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Ajustes de conversación</DialogTitle>
				</DialogHeader>
				<div className="space-y-6 py-4">
					{/* Management */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-muted-foreground" />
							<Label className="text-base">Gestión</Label>
						</div>

						<div className="space-y-2">
							<Label htmlFor="conversation-title" className="text-sm">
								Nombre de la conversación
							</Label>
							<div className="flex gap-2">
								<Input
									id="conversation-title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Nombre de la conversación"
									disabled={!canManage || saving}
								/>
								<Button
									type="button"
									onClick={handleSaveTitle}
									disabled={!canManage || saving}
								>
									Guardar
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="member-email" className="text-sm">
								Añadir miembro por email
							</Label>
							<div className="flex gap-2">
								<Input
									id="member-email"
									value={memberEmail}
									onChange={(e) => setMemberEmail(e.target.value)}
									placeholder="correo@ejemplo.com"
									disabled={!canManage || saving}
								/>
								<Button
									type="button"
									onClick={handleAddMember}
									disabled={!canManage || saving || !memberEmail.trim()}
								>
									<UserPlus className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-sm">Miembros</Label>
							<div className="space-y-2 max-h-48 overflow-auto rounded-md border border-border p-2">
								{(chat.members ?? []).map((member) => (
									<div
										key={member.id}
										className="flex items-center gap-2 text-sm"
									>
										<div className="flex-1 min-w-0">
											<p className="truncate font-medium">
												{member.name || member.email}
											</p>
											<p className="text-xs text-muted-foreground truncate">
												{member.email}
											</p>
										</div>
										{member.role === "admin" && (
											<span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
												Admin
											</span>
										)}
										<Button
											type="button"
											variant="ghost"
											size="sm"
											disabled={
												saving ||
												(!canManage && member.id !== currentUserId)
											}
											onClick={() => handleRemoveMember(member.id)}
										>
											Eliminar
										</Button>
									</div>
								))}
								{(chat.members ?? []).length === 0 && (
									<p className="text-xs text-muted-foreground text-center py-2">
										Sin miembros
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Sound Settings */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Volume2 className="h-5 w-5 text-muted-foreground" />
								<Label htmlFor="sound-enabled" className="text-base">
									Sonidos de mensajes
								</Label>
							</div>
							<Switch
								id="sound-enabled"
								checked={soundEnabled}
								onCheckedChange={setSoundEnabled}
							/>
						</div>

						{soundEnabled && (
							<div className="ml-7 space-y-4">
								<div className="flex items-center justify-between">
									<Label htmlFor="send-sound" className="text-sm">
										Sonido al enviar
									</Label>
									<Switch
										id="send-sound"
										checked={sendSoundEnabled}
										onCheckedChange={setSendSoundEnabled}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="receive-sound" className="text-sm">
										Sonido al recibir
									</Label>
									<Switch
										id="receive-sound"
										checked={receiveSoundEnabled}
										onCheckedChange={setReceiveSoundEnabled}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="volume" className="text-sm">
										Volumen: {volume[0]}%
									</Label>
									<Slider
										id="volume"
										value={volume}
										onValueChange={setVolume}
										max={100}
										step={1}
										className="w-full"
									/>
								</div>
							</div>
						)}
					</div>

					{/* Notification Settings */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Bell className="h-5 w-5 text-muted-foreground" />
							<Label htmlFor="notifications" className="text-base">
								Notificaciones
							</Label>
						</div>
						<Switch
							id="notifications"
							checked={notifications}
							onCheckedChange={setNotifications}
						/>
					</div>

					{/* Message Settings */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<MessageSquare className="h-5 w-5 text-muted-foreground" />
							<Label htmlFor="read-receipts" className="text-base">
								Confirmaciones de lectura
							</Label>
						</div>
						<Switch id="read-receipts" defaultChecked />
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
