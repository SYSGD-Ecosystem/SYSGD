import { Bot, File, Mic, Paperclip, Send, Smile, Video, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Agent } from "../../types/Agent";
import { useAgents } from "../hooks/useAgents";
import {
	type Message as BackendMessage,
	type Conversation,
	} from "../hooks/useChat";
import { useChatContext } from "../hooks/useChatContext";
import type { Message } from "./chat-interface";
import { ChatMessage } from "./chat-message";
import { ChatSettings } from "./chat-settings";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ChatConversationProps {
	chat: Conversation;
	showSettings: boolean;
	onShowSettingsChange: (show: boolean) => void;
	selectedAgent?: Agent | null;
	onRequestAgentSelection?: () => void;
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

export function AgentsChatConversation({
	chat,
	showSettings,
	onShowSettingsChange,
	selectedAgent,
	onRequestAgentSelection,
}: ChatConversationProps) {
	const {
		fetchMessages,
		messagesMap,
		setMessagesForConversation,
		markAsRead,
	} = useChatContext();

	const { sendMessageToAgent } = useAgents();

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
	const [waitingForAgent, setWaitingForAgent] = useState(false);
	const [anErrorOcurred, setAnErrorOcurred] = useState(false);
	const { toast } = useToast();

	const scrollRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const serverUrl =
		(import.meta.env.VITE_SERVER_URL as string) || "http://localhost:3000";

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
		const userId = (window as any).__CURRENT_USER_ID;
		return (list as BackendMessage[]).map((m) => ({
			id: String(m.id),
			content: m.content ?? "",
			sender:
				m.sender_id === undefined || m.sender_id === null
					? ("other" as const)
					: m.sender_id === userId
						? ("me" as const)
						: ("other" as const),
			timestamp: m.created_at
				? new Date(m.created_at).toLocaleTimeString("es-ES", {
						hour: "2-digit",
						minute: "2-digit",
					})
				: "",
			senderName:
				m.sender_id === userId
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
	}, [messagesMap, chat.id]);

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
				const res = await fetch(`${serverUrl}/api/uploads`, {
					method: "POST",
					body: fd,
					credentials: "include",
				});
				if (!res.ok) {
					const errorData = await res.json();
					throw new Error(errorData.error || "Upload failed");
				}
				const data = await res.json();
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

		if (!selectedAgent) {
			toast({
				title: "Selecciona un agente",
				description:
					"Antes de enviar un mensaje debes seleccionar un agente para esta conversación.",
			});
			onRequestAgentSelection?.();
			return;
		}

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

			// Set loading state for agent
			setWaitingForAgent(true);

				// Send message to agent
				const agentPayload = {
					agent_id: selectedAgent.id,
					conversation_id: chat.id,
					content: newMessage || "",
					...(attachment_payload.attachment_type && {
						attachment_type: attachment_payload.attachment_type as
							| "image"
							| "audio"
							| "video"
							| "file",
						attachment_url: attachment_payload.attachment_url,
					}),
				};

			const agentResponse = await sendMessageToAgent(agentPayload);

			if (agentResponse) {
					// Replace optimistic message with user message
					const userMessage: ExtendedMessage = {
						id: String(agentResponse.userMessage.id),
						content: agentResponse.userMessage.content || "",
						sender: "me",
						timestamp: agentResponse.userMessage.created_at
							? new Date(
									agentResponse.userMessage.created_at,
								).toLocaleTimeString("es-ES", {
									hour: "2-digit",
									minute: "2-digit",
								})
							: new Date().toLocaleTimeString(),
						senderName: undefined,
						attachment: attachment_payload.attachment_url
							? {
									url: attachment_payload.attachment_url,
									type:
										(attachment_payload.attachment_type as
											| "image"
											| "audio"
											| "video"
											| "file") || "file",
									name: attachment_payload.attachment_name,
									size: attachment_payload.attachment_size,
								}
							: undefined,
					};

					// Add agent response message
					const agentMessage: ExtendedMessage = {
						id: String(agentResponse.agentMessage.id),
						content: agentResponse.agentMessage.content || "",
						sender: "other",
						timestamp: agentResponse.agentMessage.created_at
							? new Date(
									agentResponse.agentMessage.created_at,
								).toLocaleTimeString("es-ES", {
									hour: "2-digit",
									minute: "2-digit",
								})
							: new Date().toLocaleTimeString(),
						senderName: selectedAgent.name,
					};

					setMessages((prev) => [
						...prev.filter((m) => m.id !== tempId),
						userMessage,
						agentMessage,
					]);

					// Update hook's messages map
					const currentHookMsgs = messagesMap[chat.id] ?? [];
					setMessagesForConversation(chat.id, [
						...currentHookMsgs,
						agentResponse.userMessage as BackendMessage,
						agentResponse.agentMessage as BackendMessage,
					]);

					// Mark as read
					try {
						await markAsRead(chat.id, String(agentResponse.agentMessage.id));
					} catch (err) {
						console.error(err);
					}
			} else {
					// Agent failed, remove optimistic message
					setMessages((prev) => prev.filter((m) => m.id !== tempId));
					toast({
						title: "Error",
						description: "No se pudo conectar con el agente. Intenta de nuevo.",
					});
				setAnErrorOcurred(true);
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
			setWaitingForAgent(false);
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

	const handleDelete = useCallback((messageId: string) => {
		// no backend delete implemented in endpoints — do local remove for now
		setMessages((prev) => prev.filter((m) => m.id !== messageId));
		// note: if you implement backend delete, call it here and refresh hook messages
	}, []);

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
						/>
					))}

					{/* Loading message for agent */}
					{waitingForAgent && selectedAgent && (
						<div className="flex gap-3">
							<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
								<Bot className="w-4 h-4" />
							</div>
							<div className="flex flex-col items-start max-w-[70%]">
								<span className="text-xs text-muted-foreground mb-1 px-1">
									{selectedAgent.name}
								</span>
								<div className="bg-muted text-foreground rounded-2xl px-4 py-2">
									<div className="flex items-center gap-2">
										<div className="flex space-x-1">
											<div
												className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
												style={{ animationDelay: "0ms" }}
											></div>
											<div
												className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
												style={{ animationDelay: "150ms" }}
											></div>
											<div
												className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
												style={{ animationDelay: "300ms" }}
											></div>
										</div>
										<span className="text-sm text-muted-foreground">
											Escribiendo...
										</span>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Input */}
			<div className="border-t border-border p-4 bg-card">
				<div className="max-w-4xl mx-auto">
					{selectedAgent && (
						<div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
									<Bot className="h-3 w-3 text-blue-600" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium text-blue-900 dark:text-blue-100">
										Agente activo: {selectedAgent.name}
									</p>
									<p className="text-xs text-blue-700 dark:text-blue-300">
										Soporte: {selectedAgent.support.join(", ")}
									</p>
								</div>
							</div>
						</div>
					)}

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
