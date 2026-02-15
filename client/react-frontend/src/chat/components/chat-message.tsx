// biome-ignore assist/source/organizeImports: <explanation>
import type React from "react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { File } from "lucide-react";
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
	onDelete: (message: ExtendedMessage) => void;
	onCopy: (content: string) => void;
	onSaveEdit: (messageId: string) => void;
	onCancelEdit: () => void;
	onEditingContentChange: (content: string) => void;
	canDelete: boolean;
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
	canDelete,
}) => {
	const renderMessageContent = (msg: ExtendedMessage) => {
		if (msg.attachment) {
			switch (msg.attachment.type) {
				case "image":
					return (
						<div className="space-y-3">
							<img
								src={msg.attachment.url || "/placeholder.svg"}
								alt="Imagen adjunta"
								className="rounded-lg w-full max-w-[360px] max-h-72 object-cover"
							/>
							{msg.content && (
								<p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
									{msg.content}
								</p>
							)}
						</div>
					);
				case "audio":
					return (
						<div className="space-y-3">
							<AudioPlayer src={msg.attachment.url} className="w-full" />
							{msg.content && (
								<p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
									{msg.content}
								</p>
							)}
						</div>
					);
				case "video":
					return (
						<div className="space-y-3">
							{/** biome-ignore lint/a11y/useMediaCaption: <explanation> */}
							<video
								controls
								className="rounded-lg w-full max-w-[360px] max-h-72"
							>
								<source src={msg.attachment.url} type="video/mp4" />
								Tu navegador no soporta el elemento de video.
							</video>
							{msg.content && (
								<p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
									{msg.content}
								</p>
							)}
						</div>
					);
				case "file":
					return (
						<div className="space-y-3">
							<div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg max-w-full min-w-0">
								<File className="h-5 w-5 flex-shrink-0" />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">
										{msg.attachment.name}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{msg.attachment.size}
									</p>
								</div>
							</div>
							{msg.content && (
								<p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
									{msg.content}
								</p>
							)}
						</div>
					);
			}
		}
		return (
			<MarkdownRenderer
				content={msg.content}
				className="break-words whitespace-pre-wrap"
			/>
		);
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
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
				className={`flex flex-col ${message.sender === "me" ? "items-end" : "items-start"} max-w-[75%] sm:max-w-[70%] min-w-0`}
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
								className="min-w-75"
								autoFocus
							/>
							<div className="flex gap-2">
								<Button size="sm" onClick={() => onSaveEdit(message.id)}>
									Guardar
								</Button>
								<Button size="sm" variant="outline" onClick={onCancelEdit}>
									Cancelar
								</Button>
							</div>
						</div>
					) : (
						<>
							<div
								className={`rounded-2xl px-4 py-3 max-w-full wrap-break-word overflow-hidden text-sm leading-relaxed ${
									message.sender === "me"
										? "bg-blue-300 text-white dark:bg-blue-600 dark:text-white"
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
								<div className="wrap-break-word overflow-wrap-anywhere max-w-full">
									{renderMessageContent(message)}
								</div>
							</div>
							{isHovered && (
								<div
									className={`absolute -top-3 ${message.sender === "me" ? "right-0" : "left-0"} opacity-0 group-hover:opacity-100 transition-opacity`}
								>
									<MessageActions
										onReply={() => onReply(message)}
										onEdit={() => onEdit(message)}
										onDelete={() => onDelete(message)}
										onCopy={() => onCopy(message.content)}
										isOwnMessage={message.sender === "me"}
										canDelete={canDelete}
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
export const ChatMessage = memo(
	ChatMessageComponent,
	(prevProps, nextProps) => {
		// Only re-render if these specific props change
		return (
			prevProps.message.id === nextProps.message.id &&
			prevProps.message.content === nextProps.message.content &&
			prevProps.isHovered === nextProps.isHovered &&
			prevProps.isEditing === nextProps.isEditing &&
			prevProps.editingContent === nextProps.editingContent
		);
	},
);
