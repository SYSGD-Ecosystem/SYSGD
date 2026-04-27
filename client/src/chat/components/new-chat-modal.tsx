/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	Bot,
	Check,
	Copy,
	Link2,
	Mail,
	Search,
	User,
	UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublicUsers } from "@/hooks/connection/usePublicUsers";
import type { PublicUser } from "@/types/user";
import { useChat } from "../hooks/useChat";
import useCurrentUser from "@/hooks/connection/useCurrentUser";

interface NewChatModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectContact: (contact: Contact) => void;
}

export interface Contact {
	id: string | number;
	name: string;
	email: string;
	type: "user" | "agent" | "bot";
	avatar: string;
	online: boolean;
	isPublic?: boolean;
}

export function NewChatModal({
	open,
	onOpenChange,
	onSelectContact,
}: NewChatModalProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [pasteInviteLink, setPasteInviteLink] = useState("");
	const [generatedLink, setGeneratedLink] = useState("");
	const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
	const [linkCopied, setLinkCopied] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [generating, setGenerating] = useState(false);
	const [sendingInvite, setSendingInvite] = useState(false);
	const [verifying, setVerifying] = useState(false);

	const { publicUsers: users } = usePublicUsers();
	const {
		createConversation,
		sendInvitation,
		fetchConversations,
		getInvitations,
		acceptInvitation,
	} = useChat();

	// carga usuarios públicos en la lista
	useEffect(() => {
		setPublicUsers(users ?? []);
	}, [users]);

	const { user } = useCurrentUser();
	const fetchCurrentUser = async (): Promise<{
		id: string;
		email: string;
	} | null> => {
		try {
			return user;
		} catch {
			return null;
		}
	};

	const filteredContacts = publicUsers.filter(
		(contact) =>
			contact.isPublic &&
			(contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				contact.email.toLowerCase().includes(searchQuery.toLowerCase())),
	);

	// Seleccionar contacto público -> crear/conseguir conversación privada con ese user
	const handleSelectContact = async (contact: Contact) => {
		try {
			/*const conv = */ await createConversation({
				contactemail: contact.email,
			});
			await fetchConversations();
			onSelectContact(contact);
			setSearchQuery("");
			onOpenChange(false);
		} catch (err) {
			console.error("Error al crear/obtener conversación:", err);
			alert("No se pudo crear la conversación. Revisa la consola.");
		}
	};

	// Uso de link pegado por el usuario: parsear y abrir conversación con email embebido
	const handleUseInviteLink = async () => {
		if (!pasteInviteLink.trim()) return;
		setVerifying(true);
		try {
			// intentar parsear como URL y extraer parámetro 'u' (email)
			let emailFromLink: string | null = null;
			try {
				const url = new URL(
					pasteInviteLink.includes("://")
						? pasteInviteLink
						: `https://dummy${pasteInviteLink}`,
				);
				// buscar query param 'u' o 'user'
				emailFromLink =
					url.searchParams.get("u") || url.searchParams.get("user");
				// si no hay query y la ruta tiene /invite/<email> intentamos extraer
				if (!emailFromLink) {
					const path = url.pathname;
					const m = path.match(/\/invite\/([^/?]+)/);
					if (m) emailFromLink = decodeURIComponent(m[1]);
				}
			} catch {
				// si no es una URL, intentar si el usuario pegó texto tipo "sysgd.app/invite?u=..."
				try {
					const q = new URL(`https://${pasteInviteLink}`);
					emailFromLink = q.searchParams.get("u") || q.searchParams.get("user");
				} catch {
					// ignore
				}
			}

			// si encontramos email, crear conversación con ese email
			if (emailFromLink) {
				const conv = await createConversation({ contactemail: emailFromLink });
				await fetchConversations();
				// devolver información de contacto mínima al selector
				onSelectContact({
					id: conv?.created_by ?? 0,
					name: emailFromLink,
					email: emailFromLink,
					type: "user",
					avatar: "👤",
					online: false,
				});
				setPasteInviteLink("");
				onOpenChange(false);
				return;
			}

			// si no obtuvimos email, intentamos tratar el link como token: pedir al backend info
			// (endpoint opcional: /api/chat/invite/resolve?token=xxx) - si existe en tu backend, úsalo.
			// Aquí intentamos consultar un endpoint que puede no existir; si no, mostramos error.
			try {
				const token = extractTokenFromLink(pasteInviteLink);
				if (token) {
					const res = await fetch(
						`/api/chat/invitations/resolve?token=${encodeURIComponent(token)}`,
						{
							credentials: "include",
						},
					);
					if (res.ok) {
						const info = await res.json();
						// info { email } o { invitation_id } dependiendo de implementación backend
						if (info.email) {
							const conv = await createConversation({
								contactemail: info.email,
							});
							await fetchConversations();
							onSelectContact({
								id: conv?.created_by ?? 0,
								name: info.email,
								email: info.email,
								type: "user",
								avatar: "👤",
								online: false,
							});
							setPasteInviteLink("");
							onOpenChange(false);
							return;
						}
						// si info.invitation_id: aceptar invitación directamente
						if (info.invitation_id) {
							await acceptInvitation(info.invitation_id);
							await fetchConversations();
							// después de aceptar, backend ya añade al usuario a la conversación; intentar obtenerla
							// se puede obtener la lista y seleccionar la conversación más reciente
							const convs = await fetch("/api/chat/conversations", {
								credentials: "include",
							}).then((r) => r.json());
							const joined =
								convs?.find((c: any) => c.id === info.conversation_id) ||
								convs?.[0];
							onSelectContact({
								id:
									joined?.members?.find((m: any) => m.email !== undefined)
										?.id ?? 0,
								name: joined?.title ?? "Conversación",
								email: joined?.members?.[0]?.email ?? "unknown",
								type: "user",
								avatar: "👤",
								online: false,
							});
							setPasteInviteLink("");
							onOpenChange(false);
							return;
						}
					}
				}
			} catch (err) {
				// Request fallback failed or endpoint no existe
				console.warn(
					"No se pudo resolver el token en backend (endpoint opcional).",
					err,
				);
			}

			alert(
				"No se pudo validar el link de invitación. Asegúrate de que incluya el parámetro 'u' con el email (ej: ?u=@usuario) o pega un link válido.",
			);
		} catch (err) {
			console.error("Error al usar link de invitación:", err);
			alert("Error al procesar el link de invitación.");
		} finally {
			setVerifying(false);
		}
	};

	// Generar link público (contiene email del usuario actual y token aleatorio)
	const handleGenerateLink = async () => {
		setGenerating(true);
		try {
			const me = await fetchCurrentUser();
			if (!me || !me.email) {
				alert(
					"No se pudo obtener el usuario actual. Asegúrate de estar autenticado.",
				);
				setGenerating(false);
				return;
			}
			// token aleatorio corto
			const token = Math.random().toString(36).slice(2, 10);
			// link con email embebido; al usar el link el cliente intentará crear conversación con ?u=email
			const link = `${location.origin}/invite?u=${encodeURIComponent(
				me.email,
			)}&t=${token}`;
			setGeneratedLink(link);
			// opcional: podrías POSTear el token al backend para registrar el invite (si tienes endpoint)
			// try { await fetch("/api/chat/invitations/register-token", { method: "POST", credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, conversation_id: null }) }) } catch(e){}
		} catch (err) {
			console.error("Error al generar link:", err);
			alert("No se pudo generar el link de invitación.");
		} finally {
			setGenerating(false);
		}
	};

	// Copiar link al portapapeles
	const handleCopyGeneratedLink = () => {
		if (!generatedLink) return;
		navigator.clipboard.writeText(generatedLink);
		setLinkCopied(true);
		setTimeout(() => setLinkCopied(false), 2000);
	};

	// Enviar invitación por email (crea/asegura conversación "canal" del creador y luego inserta invitación)
	const handleSendInvitationByEmail = async () => {
		if (!inviteEmail.trim()) {
			alert("Ingresa un email válido");
			return;
		}
		setSendingInvite(true);
		try {
			const me = await fetchCurrentUser();
			if (!me || !me.email) {
				alert(
					"No se pudo obtener el usuario actual. Autentícate e intenta de nuevo.",
				);
				setSendingInvite(false);
				return;
			}
			// Asegurar una conversación "de invitaciones" creada por el usuario para poder enviar invitaciones vinculadas
			// Creamos una conversación 'channel' privada solo con el creador (backend añadirá created_by)
			const conv = await createConversation({
				members: [me.email],
				title: `${me.email}-invitations`,
				type: "channel",
			});
			const conversationId = conv.id;
			// llamar al endpoint de sendInvitation expuesto por hook
			await sendInvitation(conversationId, inviteEmail);
			// refrescar invitaciones del usuario
			await getInvitations();
			alert("Invitación enviada por email (si el backend lo permite).");
			setInviteEmail("");
		} catch (err) {
			console.error("Error al enviar invitación por email:", err);
			alert("No se pudo enviar la invitación por email.");
		} finally {
			setSendingInvite(false);
		}
	};

	// Extrae token simple del path /invite/<token> o de query t=
	const extractTokenFromLink = (link: string) => {
		try {
			const url = new URL(link.includes("://") ? link : `https://dummy${link}`);
			return (
				url.searchParams.get("t") ||
				(() => {
					const m = url.pathname.match(/\/invite\/([^/?]+)/);
					return m ? m[1] : null;
				})()
			);
		} catch {
			return null;
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[650px]">
				<DialogHeader>
					<DialogTitle>Nueva Conversación</DialogTitle>
					<DialogDescription>
						Selecciona un usuario público, pega un link de invitación o genera
						tu propio link para compartir.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="public" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="public">Usuarios Públicos</TabsTrigger>
						<TabsTrigger value="invite">Usar Link</TabsTrigger>
						<TabsTrigger value="generate">Generar / Enviar</TabsTrigger>
					</TabsList>

					<TabsContent value="public" className="space-y-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar usuarios públicos..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>

						<ScrollArea className="h-[350px] pr-4">
							<div className="space-y-1">
								{filteredContacts.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										<UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
										<p className="font-medium">
											No se encontraron usuarios públicos
										</p>
										<p className="text-sm mt-1">
											Intenta con otro término de búsqueda
										</p>
									</div>
								) : (
									filteredContacts.map((contact) => (
										<button
											type="button"
											key={contact.id}
											onClick={() => handleSelectContact(contact)}
											className="w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
										>
											<div className="flex items-center gap-3">
												<div className="relative flex-shrink-0">
													<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
														{contact.avatar}
													</div>
													{contact.online && (
														<div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-0.5">
														<h4 className="font-semibold text-sm truncate">
															{contact.name}
														</h4>
														{contact.type === "agent" ? (
															<Bot className="h-3.5 w-3.5 text-primary flex-shrink-0" />
														) : (
															<User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
														)}
													</div>
													<p className="text-xs text-muted-foreground truncate">
														{contact.email}
													</p>
												</div>
											</div>
										</button>
									))
								)}
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="invite" className="space-y-4">
						<div className="space-y-3">
							<div className="space-y-2">
								<Label htmlFor="invite-link">
									Link de Invitación (pegar aquí)
								</Label>
								<div className="flex gap-2">
									<div className="relative flex-1">
										<Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											id="invite-link"
											placeholder="https://work.ecosysgd.com/login/invite?u=@usuario..."
											value={pasteInviteLink}
											onChange={(e) => setPasteInviteLink(e.target.value)}
											className="pl-9"
										/>
									</div>
									<Button
										onClick={handleUseInviteLink}
										disabled={!pasteInviteLink.trim() || verifying}
									>
										{verifying ? "Verificando..." : "Usar Link"}
									</Button>
								</div>
							</div>

							<div className="bg-muted/50 rounded-lg p-4 space-y-2">
								<h4 className="font-medium text-sm flex items-center gap-2">
									<Link2 className="h-4 w-4" />
									¿Cómo funciona?
								</h4>
								<ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
									<li>
										Pega el link que te compartieron (debe contener
										?u=&lt;email&gt;).
									</li>
									<li>
										El sistema intentará crear la conversación automáticamente
										con ese usuario.
									</li>
									<li>
										Si el link tiene token registrado en backend, el cliente
										tratará de resolverlo (si tu backend soporta
										/invitations/resolve).
									</li>
								</ul>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="generate" className="space-y-4">
						<div className="space-y-3">
							<div className="space-y-2">
								<Label>Tu Link de Invitación</Label>
								<p className="text-sm text-muted-foreground">
									Genera un link (contiene tu email). Quien lo abra podrá
									iniciar conversación contigo automáticamente.
								</p>
							</div>

							{!generatedLink ? (
								<Button
									onClick={handleGenerateLink}
									className="w-full"
									size="lg"
									disabled={generating}
								>
									<Link2 className="h-4 w-4 mr-2" />
									{generating ? "Generando..." : "Generar Link de Invitación"}
								</Button>
							) : (
								<div className="space-y-3">
									<div className="flex gap-2">
										<Input
											value={generatedLink}
											readOnly
											className="font-mono text-sm"
										/>
										<Button
											onClick={handleCopyGeneratedLink}
											variant="outline"
											size="icon"
										>
											{linkCopied ? (
												<Check className="h-4 w-4" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</Button>
									</div>

									<div className="flex gap-2">
										<Input
											placeholder="Enviar invitación por email..."
											value={inviteEmail}
											onChange={(e) => setInviteEmail(e.target.value)}
											className="flex-1"
										/>
										<Button
											onClick={handleSendInvitationByEmail}
											disabled={sendingInvite}
										>
											<Mail className="h-4 w-4 mr-2" />
											{sendingInvite ? "Enviando..." : "Enviar"}
										</Button>
									</div>

									<Button
										onClick={() => {
											setGeneratedLink("");
											setInviteEmail("");
										}}
									>
										Generar Nuevo Link
									</Button>
								</div>
							)}

							<div className="bg-muted/50 rounded-lg p-4 space-y-2">
								<h4 className="font-medium text-sm flex items-center gap-2">
									<UserPlus className="h-4 w-4" />
									Compartir & administrar
								</h4>
								<ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
									<li>Comparte el link con quien quieras chatear.</li>
									<li>
										Puedes enviar invitaciones por email vinculadas a una
										conversación especial.
									</li>
									<li>
										Si tu backend registra tokens, el cliente intentará
										resolverlos al pegar links.
									</li>
								</ul>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
