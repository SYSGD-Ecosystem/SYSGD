import { File, Mic, Paperclip, Send, Smile, Video, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	type Message as BackendMessage,
	type Conversation,
} from "../hooks/useChat";
import type { Message } from "./chat-interface";
import { ChatMessage } from "./chat-message";
import { ChatSettings } from "./chat-settings";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "../hooks/useChatContext";
import { useSocketContext, useSocketEvents } from "../hooks/useSocket";
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

interface ChatConversationProps {
	chat: Conversation;
	showSettings: boolean;
	onShowSettingsChange: (show: boolean) => void;
}

export interface ExtendedMessage extends Message {
	attachment?: {
		type: "image" | "audio" | "video" | "file";
		url: string;
		name?: string;
		size?: string;
	};
	replyTo?: {
		id: string;
		content: string;
		senderName?: string;
	};
}

/**
 * ChatConversation:
 * - integra useChat para fetch/send/mark-as-read
 * - sube archivos a /api/uploads (POST FormData) — el backend debe exponer este endpoint
 * - actualiza UI de forma optimista y luego reemplaza con la respuesta del servidor
 */

export function ChatConversation({
	chat,
	showSettings,
	onShowSettingsChange,
}: ChatConversationProps) {
	const {
		fetchMessages,
		messagesMap,
		sendMessage,
		deleteMessage,
		setMessagesForConversation,
		markAsRead,
	} = useChatContext();

	const [messages, setMessages] = useState<ExtendedMessage[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [editingContent, setEditingContent] = useState("");
	const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null);
	const [attachment, setAttachment] = useState<File | null>(null);
	const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
		null,
	);
	const [sending, setSending] = useState(false);
	const [messageToDelete, setMessageToDelete] =
		useState<ExtendedMessage | null>(null);
	const [anErrorOcurred, setAnErrorOcurred] = useState(false);
	const { toast } = useToast();

	const scrollRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);

	const serverUrl =
		(import.meta.env.VITE_SERVER_URL as string) || "http://localhost:3000";

	const { joinConversation, leaveConversation } = useSocketContext();

	// Receive socket events
	useSocketEvents({
		onNewMessage: (message) => {
			console.log("Socket: Received new message:", message);
			if (message.conversation_id === chat.id) {
				const currentHookMsgs = messagesMap[chat.id] ?? [];
				setMessagesForConversation(chat.id, [...currentHookMsgs, message]);
			}
		},
	});

	// Get current user ID
	useEffect(() => {
		fetch(`${serverUrl}/api/auth/me`, { credentials: "include" })
			.then((res) => res.json())
			.then((data) => {
				setCurrentUserId(data?.id ?? null);
			})
			.catch(() => {});
	}, [serverUrl]);

	// Log socket connection status
	useEffect(() => {
		console.log("ChatConversation mounted, socket should connect");
		return () => {
			console.log("ChatConversation unmounting");
		};
	}, []);

	// Join conversation when chat changes
	useEffect(() => {
		if (!chat?.id) return;
		joinConversation(chat.id);

		return () => {
			leaveConversation(chat.id);
		};
	}, [chat?.id, joinConversation, leaveConversation]);

	// --- Load messages from backend when chat changes ---
	useEffect(() => {
		console.log("Chat changed:", chat);
		if (!chat?.id) return;
		// fetchMessages will populate messagesMap inside the hook
		fetchMessages(chat.id).catch((e) => {
			// fetchMessages already sets error inside hook; here just log
			console.error("fetchMessages error:", e);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chat?.id]);

	// --- Mirror hook's messagesMap into local messages state for rendering and local UX edits ---
	// Use useMemo to avoid recalculating on every render
	const normalizedMessages = useMemo(() => {
		const list = messagesMap?.[chat.id] ?? [];
		// map backend message shape to ExtendedMessage if needed
		return (list as BackendMessage[]).map((m) => ({
			id: String(m.id),
			content: m.content ?? "",
			sender:
				m.sender_id === undefined || m.sender_id === null
					? ("other" as const)
					: m.sender_id === currentUserId
						? ("me" as const)
						: ("other" as const),
			timestamp: m.created_at
				? new Date(m.created_at).toLocaleTimeString("es-ES", {
						hour: "2-digit",
						minute: "2-digit",
					})
				: "",
			senderName:
				m.sender_id === currentUserId
					? "Tú"
					: m.sender_name || m.sender_email || "Usuario",
			avatar: undefined, // Backend Message doesn't have avatar field
			attachment: m.attachment_url
				? {
						type: (m.attachment_type as any) ?? "file",
						url: m.attachment_url,
						name: undefined,
						size: undefined,
					}
				: undefined,
			replyTo: m.reply_to
				? {
						id: String(m.reply_to),
						content: "", // Backend doesn't have reply_to content
						senderName: undefined,
					}
				: undefined,
		}));
	}, [messagesMap, chat.id, currentUserId]);

	const isConversationAdmin = useMemo(() => {
		if (!currentUserId) return false;
		return (
			chat.members?.some(
				(member) => member.id === currentUserId && member.role === "admin",
			) ?? false
		);
	}, [chat.members, currentUserId]);

	const isConversationCreator = useMemo(() => {
		if (!currentUserId) return false;
		return chat.created_by === currentUserId;
	}, [chat.created_by, currentUserId]);

	// Update local messages state when normalized messages change
	useEffect(() => {
		setMessages(normalizedMessages);
		// auto mark as read using last message id
		if (normalizedMessages.length > 0) {
			const last = normalizedMessages[normalizedMessages.length - 1];
			// call markAsRead with backend id (we stored id as string); the hook will send it
			markAsRead(chat.id, last.id).catch(() => {});
		}
	}, [normalizedMessages, chat.id, markAsRead]);

	// --- Scroll to bottom when messages change ---
	useEffect(() => {
		if (scrollRef.current) {
			// Smooth scroll to bottom
			scrollRef.current.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [messages]);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setAttachment(file);

		// Create preview for images
		if (file.type.startsWith("image/")) {
			const reader = new FileReader();
			reader.onload = (ev) => {
				setAttachmentPreview(ev.target?.result as string);
			};
			reader.readAsDataURL(file);
		} else {
			setAttachmentPreview(null);
		}
	};

	const getAttachmentType = (
		file: File,
	): "image" | "audio" | "video" | "file" => {
		if (file.type.startsWith("image/")) return "image";
		if (file.type.startsWith("audio/")) return "audio";
		if (file.type.startsWith("video/")) return "video";
		return "file";
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

	// upload file to S3 via backend
	const uploadFile = useCallback(
		async (file: File) => {
			const fd = new FormData();
			fd.append("file", file);
			try {
				console.log("Uploading file:", file.name, file.type, file.size);
				const res = await fetch(`${serverUrl}/api/uploads`, {
					method: "POST",
					body: fd,
					credentials: "include",
				});
				console.log("Upload response status:", res.status);
				if (!res.ok) {
					const errorData = await res.json();
					console.error("Upload error:", errorData);
					throw new Error(errorData.error || "Upload failed");
				}
				const data = await res.json();
				console.log("Upload success:", data);
				return data; // { url, attachment_name, attachment_size, attachment_type, key, bucket }
			} catch (err) {
				console.error("uploadFile error:", err);
				throw err;
			}
		},
		[serverUrl],
	);

	// send message using hook; if attachment present, first upload then include attachment_url/type
	const handleSendMessage = async () => {
		if (sending) return;
		if (!newMessage.trim() && !attachment) return;

		setSending(true);

		setAnErrorOcurred(false);

		// optimistic message (temporary id)
		const tempId = "tmp-" + Date.now().toString();
		const optimistic: ExtendedMessage = {
			id: tempId,
			content: newMessage || "",
			sender: "me",
			timestamp: new Date().toLocaleTimeString("es-ES", {
				hour: "2-digit",
				minute: "2-digit",
			}),
			...(attachment && {
				attachment: {
					type: getAttachmentType(attachment),
					url: attachmentPreview || URL.createObjectURL(attachment),
					name: attachment.name,
					size: formatFileSize(attachment.size),
				},
			}),
			...(replyingTo && {
				replyTo: {
					id: replyingTo.id,
					content: replyingTo.content,
					senderName: replyingTo.senderName,
				},
			}),
		};

		// update UI immediately
		setMessages((prev) => [...prev, optimistic]);

		try {
			const attachment_payload: {
				attachment_url?: string;
				attachment_type?: string;
				attachment_name?: string;
				attachment_size?: string;
			} = {};
			if (attachment) {
				try {
					const uploaded = await uploadFile(attachment);
					// normalize expected fields
					attachment_payload.attachment_url =
						uploaded.url || uploaded.attachment_url || uploaded.fileUrl;
					attachment_payload.attachment_type =
						uploaded.attachment_type || getAttachmentType(attachment);
					attachment_payload.attachment_name =
						uploaded.attachment_name || attachment.name;
					attachment_payload.attachment_size =
						uploaded.attachment_size || formatFileSize(attachment.size);
				} catch (err) {
					// if upload fails, remove optimistic attachment preview but still attempt to send text
					console.warn(
						"upload failed, will send message without attachment",
						err,
					);
					// remove preview from optimistic message
					setMessages((prev) =>
						prev.map((m) =>
							m.id === tempId ? { ...m, attachment: undefined } : m,
						),
					);
				}
			}

			const payload: any = {
				content: newMessage || null,
				...attachment_payload,
				reply_to: replyingTo?.id ?? null,
			};

			const sent = await sendMessage(chat.id, payload);
			if (sent) {
				const normalizedBackend: ExtendedMessage = {
					id: String((sent as any).id),
					content: sent.content ?? "",
					sender: "me",
					timestamp: sent.created_at
						? new Date(sent.created_at).toLocaleTimeString("es-ES", {
								hour: "2-digit",
								minute: "2-digit",
							})
						: new Date().toLocaleTimeString(),
					senderName: (sent as any).sender_name ?? undefined,
					attachment: (sent as any).attachment_url
						? {
								url: (sent as any).attachment_url,
								type:
									(sent as any).attachment_type ??
									attachment_payload.attachment_type ??
									"file",
								name:
									(sent as any).attachment_name ??
									attachment_payload.attachment_name,
								size:
									(sent as any).attachment_size ??
									attachment_payload.attachment_size,
							}
						: undefined,
					replyTo: sent.reply_to
						? {
								id: String(sent.reply_to),
								content: (sent as any).reply_preview ?? "",
								senderName: undefined,
							}
						: undefined,
				};

				setMessages((prev) =>
					prev.map((m) => (m.id === tempId ? normalizedBackend : m)),
				);

				const currentHookMsgs = messagesMap[chat.id] ?? [];
				setMessagesForConversation(chat.id, [
					...currentHookMsgs,
					sent as BackendMessage,
				]);

				try {
					await markAsRead(chat.id, String(sent.id));
				} catch (err) {
					console.error(err);
				}
			}
		} catch (err) {
			console.error("Error sending message:", err);
			setMessages((prev) => prev.filter((m) => m.id !== tempId));
			toast({
				title: "Error",
				description: "No se pudo enviar el mensaje. Intenta de nuevo."
			});
			setAnErrorOcurred(true);
		} finally {
			setSending(false);
			setNewMessage("");
			setAttachment(null);
			setAttachmentPreview(null);
			setReplyingTo(null);
			if (fileInputRef.current) {
				if (!anErrorOcurred) {
					fileInputRef.current.value = "";
				}
			}
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void handleSendMessage();
		}
	};

	const handleReply = useCallback((message: ExtendedMessage) => {
		setReplyingTo(message);
	}, []);

	const handleEdit = useCallback((message: ExtendedMessage) => {
		setEditingMessageId(message.id);
		setEditingContent(message.content);
	}, []);

	const handleDelete = useCallback((message: ExtendedMessage) => {
		setMessageToDelete(message);
	}, []);

	const handleConfirmDelete = useCallback(async () => {
		if (!messageToDelete) return;
		try {
			await deleteMessage(chat.id, messageToDelete.id);
			setMessageToDelete(null);
		} catch (err: any) {
			const msg =
				err?.response?.data?.error ||
				err?.message ||
				"Error al eliminar mensaje";
			toast({ variant: "destructive", title: "Error", description: msg });
		}
	}, [deleteMessage, chat.id, messageToDelete, toast]);

	const handleCopy = useCallback((content: string) => {
		navigator.clipboard.writeText(content);
	}, []);

	const handleSaveEdit = useCallback(
		(messageId: string) => {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === messageId ? { ...m, content: editingContent } : m,
				),
			);
			setEditingMessageId(null);
			setEditingContent("");
			// note: no backend edit endpoint implemented; if you add it, call it here and refresh hook
		},
		[editingContent],
	);

	const handleCancelEdit = useCallback(() => {
		setEditingMessageId(null);
		setEditingContent("");
	}, []);

	const removeAttachment = () => {
		setAttachment(null);
		setAttachmentPreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleSetEditingContent = useCallback((content: string) => {
		setEditingContent(content);
	}, []);

	return (
		<div className="h-full flex flex-col">
			{/* Messages */}
			<ScrollArea className="flex-1 p-4" ref={scrollRef}>
				<div className="space-y-4 max-w-4xl mx-auto">
					{messages.map((message) => (
						<ChatMessage
							key={message.id}
							message={message}
							isHovered={hoveredMessageId === message.id}
							isEditing={editingMessageId === message.id}
							editingContent={editingContent}
							onHover={setHoveredMessageId}
							onReply={handleReply}
							onEdit={handleEdit}
							onDelete={handleDelete}
							onCopy={handleCopy}
							onSaveEdit={handleSaveEdit}
							onCancelEdit={handleCancelEdit}
							onEditingContentChange={handleSetEditingContent}
							canDelete={
								message.sender === "me" ||
								isConversationAdmin ||
								isConversationCreator
							}
						/>
					))}

				</div>
			</ScrollArea>

			<AlertDialog
				open={!!messageToDelete}
				onOpenChange={(open) => !open && setMessageToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmDelete}>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Input */}
			<div className="border-t border-border p-4 bg-card">
				<div className="max-w-4xl mx-auto">
					{replyingTo && (
						<div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-foreground">
									Respondiendo a {replyingTo.senderName || "Usuario"}
								</p>
								<p className="text-xs text-muted-foreground truncate">
									{replyingTo.content}
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								onClick={() => setReplyingTo(null)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					)}

					{attachment && (
						<div className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
							{attachmentPreview ? (
								<img
									src={attachmentPreview || "/placeholder.svg"}
									alt="Preview"
									className="h-16 w-16 object-cover rounded"
								/>
							) : (
								<div className="h-16 w-16 bg-background rounded flex items-center justify-center">
									{attachment.type.startsWith("audio/") && (
										<Mic className="h-6 w-6" />
									)}
									{attachment.type.startsWith("video/") && (
										<Video className="h-6 w-6" />
									)}
									{!attachment.type.startsWith("audio/") &&
										!attachment.type.startsWith("video/") && (
											<File className="h-6 w-6" />
										)}
								</div>
							)}
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">
									{attachment.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(attachment.size)}
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={removeAttachment}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					)}

					<div className="flex items-end gap-2">
						<input
							ref={fileInputRef}
							type="file"
							className="hidden"
							onChange={handleFileSelect}
							accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
						/>
						<Button
							variant="ghost"
							size="icon"
							className="flex-shrink-0"
							onClick={() => fileInputRef.current?.click()}
						>
							<Paperclip className="h-5 w-5" />
						</Button>
						<div className="flex-1 relative">
							<Textarea
								placeholder="Escribe un mensaje..."
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								onKeyPress={handleKeyPress}
								className="pr-10 min-h-11 resize-none font-sans text-base border-none no-scrollbar"
							/>
							<Button
								variant="ghost"
								size="icon"
								className="absolute right-1 top-1/2 -translate-y-1/2"
							>
								<Smile className="h-5 w-5" />
							</Button>
						</div>
						<Button
							onClick={() => void handleSendMessage()}
							size="icon"
							className="flex-shrink-0"
							disabled={(!newMessage.trim() && !attachment) || sending}
						>
							<Send className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</div>

			<ChatSettings open={showSettings} onOpenChange={onShowSettingsChange} />
		</div>
	);
}
