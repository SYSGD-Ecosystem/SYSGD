import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { File, Mic, Video } from "lucide-react";
import { MessageActions } from "./message-actions";
import { AudioPlayer } from "./audio-player";
import { MarkdownRenderer } from "./markdown-renderer";
import type { ExtendedMessage } from "./chat-conversation";

interface ChatMessageProps {
	message: ExtendedMessage;
	isHovered: boolean;
	isEditing: boolean;
	editingContent: string;
	onHover: (id: string | null) => void;
	onReply: (message: ExtendedMessage) => void;
	onEdit: (message: ExtendedMessage) => void;
	onDelete: (messageId: string) => void;
	onCopy: (content: string) => void;
	onSaveEdit: (messageId: string) => void;
	onCancelEdit: () => void;
	onEditingContentChange: (content: string) => void;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({
	message,
	isHovered,
	isEditing,
	editingContent,
	onHover,
	onReply,
	onEdit,
	onDelete,
	onCopy,
	onSaveEdit,
	onCancelEdit,
	onEditingContentChange,
}) => {
	const renderMessageContent = (msg: ExtendedMessage) => {
		if (msg.attachment) {
			switch (msg.attachment.type) {
				case "image":
					return (
						<div className="space-y-2">
							<img
								src={msg.attachment.url || "/placeholder.svg"}
								alt="Imagen adjunta"
								className="rounded-lg max-w-sm max-h-64 object-cover"
							/>
							{msg.content && (
								<p className="text-sm leading-relaxed">{msg.content}</p>
							)}
						</div>
					);
				case "audio":
					return (
						<div className="space-y-2">
							<AudioPlayer src={msg.attachment.url} />
							{msg.content && (
								<p className="text-sm leading-relaxed">{msg.content}</p>
							)}
						</div>
					);
				case "video":
					return (
						<div className="space-y-2">
							<video controls className="rounded-lg max-w-sm max-h-64">
								<source src={msg.attachment.url} type="video/mp4" />
								Tu navegador no soporta el elemento de video.
							</video>
							{msg.content && (
								<p className="text-sm leading-relaxed">{msg.content}</p>
							)}
						</div>
					);
				case "file":
					return (
						<div className="space-y-2">
							<div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
								<File className="h-5 w-5" />
								<div className="flex-1">
									<p className="text-sm font-medium">
										{msg.attachment.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{msg.attachment.size}
									</p>
								</div>
							</div>
							{msg.content && (
								<p className="text-sm leading-relaxed">{msg.content}</p>
							)}
						</div>
					);
			}
		}
		return <MarkdownRenderer content={msg.content} />;
	};

	return (
		<div
			className={`flex gap-3 ${message.sender === "me" ? "flex-row-reverse" : ""}`}
			onMouseEnter={() => onHover(message.id)}
			onMouseLeave={() => onHover(null)}
		>
			{message.sender === "other" && (
				<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
					{message.avatar || message.senderName?.charAt(0)}
				</div>
			)}
			<div
				className={`flex flex-col ${message.sender === "me" ? "items-end" : "items-start"} max-w-[70%]`}
			>
				{message.sender === "other" && message.senderName && (
					<span className="text-xs text-muted-foreground mb-1 px-1">
						{message.senderName}
					</span>
				)}
				<div className="relative group">
					{isEditing ? (
						<div className="space-y-2">
							<Input
								value={editingContent}
								onChange={(e) => onEditingContentChange(e.target.value)}
								className="min-w-[300px]"
								autoFocus
							/>
							<div className="flex gap-2">
								<Button
									size="sm"
									onClick={() => onSaveEdit(message.id)}
								>
									Guardar
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={onCancelEdit}
								>
									Cancelar
								</Button>
							</div>
						</div>
					) : (
						<>
							<div
								className={`rounded-2xl px-4 py-2 ${
									message.sender === "me"
										? "bg-primary text-primary-foreground"
										: "bg-muted text-foreground"
								}`}
							>
								{message.replyTo && (
									<div className="mb-2 pb-2 border-b border-current/20">
										<p className="text-xs opacity-70 font-medium">
											{message.replyTo.senderName || "Usuario"}
										</p>
										<p className="text-xs opacity-70 truncate">
											{message.replyTo.content}
										</p>
									</div>
								)}
								{renderMessageContent(message)}
							</div>
							{isHovered && (
								<div
									className={`absolute -top-3 ${message.sender === "me" ? "right-0" : "left-0"} opacity-0 group-hover:opacity-100 transition-opacity`}
								>
									<MessageActions
										onReply={() => onReply(message)}
										onEdit={() => onEdit(message)}
										onDelete={() => onDelete(message.id)}
										onCopy={() => onCopy(message.content)}
										isOwnMessage={message.sender === "me"}
									/>
								</div>
							)}
						</>
					)}
				</div>
				<span className="text-xs text-muted-foreground mt-1 px-1">
					{message.timestamp}
				</span>
			</div>
		</div>
	);
};

// Memoize the component to prevent unnecessary re-renders
export const ChatMessage = memo(ChatMessageComponent, (prevProps, nextProps) => {
	// Only re-render if these specific props change
	return (
		prevProps.message.id === nextProps.message.id &&
		prevProps.message.content === nextProps.message.content &&
		prevProps.isHovered === nextProps.isHovered &&
		prevProps.isEditing === nextProps.isEditing &&
		prevProps.editingContent === nextProps.editingContent
	);
});
