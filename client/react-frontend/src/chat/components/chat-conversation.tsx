"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Paperclip, Smile, X, File, Mic, Video } from "lucide-react"
import type { Chat, Message } from "./chat-interface"
import { MessageActions } from "./message-actions"
import { ChatSettings } from "./chat-settings"
import { AudioPlayer } from "./audio-player"

interface ChatConversationProps {
  chat: Chat
  showSettings: boolean
  onShowSettingsChange: (show: boolean) => void
}

export interface ExtendedMessage extends Message {
  attachment?: {
    type: "image" | "audio" | "video" | "file"
    url: string
    name?: string
    size?: string
  }
  replyTo?: {
    id: string
    content: string
    senderName?: string
  }
}

// Mock messages
const mockMessages: Record<string, ExtendedMessage[]> = {
  "1": [
    {
      id: "1",
      content: "Hola, ¿cómo estás?",
      sender: "other",
      timestamp: "10:00",
      senderName: "María González",
      avatar: "MG",
    },
    {
      id: "2",
      content: "¡Hola María! Todo bien, ¿y tú?",
      sender: "me",
      timestamp: "10:02",
    },
    {
      id: "3",
      content: "Muy bien, gracias. Quería consultarte sobre el proyecto",
      sender: "other",
      timestamp: "10:05",
      senderName: "María González",
      avatar: "MG",
    },
    {
      id: "4",
      content: "Claro, dime en qué te puedo ayudar",
      sender: "me",
      timestamp: "10:06",
    },
    {
      id: "5",
      content: "Perfecto, nos vemos mañana",
      sender: "other",
      timestamp: "10:30",
      senderName: "María González",
      avatar: "MG",
    },
  ],
  "2": [
    {
      id: "1",
      content: "¡Hola! Bienvenido al soporte técnico de SYSGD",
      sender: "other",
      timestamp: "09:00",
      senderName: "Agente Soporte Técnico",
      avatar: "🤖",
    },
    {
      id: "2",
      content: "¿En qué puedo ayudarte hoy?",
      sender: "other",
      timestamp: "09:15",
      senderName: "Agente Soporte Técnico",
      avatar: "🤖",
    },
  ],
}

export function ChatConversation({ chat, showSettings, onShowSettingsChange }: ChatConversationProps) {
  const [messages, setMessages] = useState<ExtendedMessage[]>(mockMessages[chat.id] || [])
  const [newMessage, setNewMessage] = useState("")
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sendSoundRef = useRef<HTMLAudioElement | null>(null)
  const receiveSoundRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize audio elements
    sendSoundRef.current = new Audio("/send-message-sound.jpg")
    receiveSoundRef.current = new Audio("/receive-message-sound.jpg")
  }, [])

  useEffect(() => {
    setMessages(mockMessages[chat.id] || [])
  }, [chat.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAttachment(file)

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setAttachmentPreview(null)
    }
  }

  const getAttachmentType = (file: File): "image" | "audio" | "video" | "file" => {
    if (file.type.startsWith("image/")) return "image"
    if (file.type.startsWith("audio/")) return "audio"
    if (file.type.startsWith("video/")) return "video"
    return "file"
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() && !attachment) return

    const message: ExtendedMessage = {
      id: Date.now().toString(),
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
    }

    setMessages([...messages, message])
    setNewMessage("")
    setAttachment(null)
    setAttachmentPreview(null)
    setReplyingTo(null)

    sendSoundRef.current?.play().catch(() => {})
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleReply = (message: ExtendedMessage) => {
    setReplyingTo(message)
  }

  const handleEdit = (message: ExtendedMessage) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }

  const handleDelete = (messageId: string) => {
    setMessages(messages.filter((m) => m.id !== messageId))
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleSaveEdit = (messageId: string) => {
    setMessages(messages.map((m) => (m.id === messageId ? { ...m, content: editingContent } : m)))
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  const removeAttachment = () => {
    setAttachment(null)
    setAttachmentPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const renderMessageContent = (message: ExtendedMessage) => {
    if (message.attachment) {
      switch (message.attachment.type) {
        case "image":
          return (
            <div className="space-y-2">
              <img
                src={message.attachment.url || "/placeholder.svg"}
                alt="Imagen adjunta"
                className="rounded-lg max-w-sm max-h-64 object-cover"
              />
              {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}
            </div>
          )
        case "audio":
          return (
            <div className="space-y-2">
              <AudioPlayer src={message.attachment.url} />
              {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}
            </div>
          )
        case "video":
          return (
            <div className="space-y-2">
              <video controls className="rounded-lg max-w-sm max-h-64">
                <source src={message.attachment.url} type="video/mp4" />
                Tu navegador no soporta el elemento de video.
              </video>
              {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}
            </div>
          )
        case "file":
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                <File className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{message.attachment.name}</p>
                  <p className="text-xs text-muted-foreground">{message.attachment.size}</p>
                </div>
              </div>
              {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}
            </div>
          )
      }
    }
    return <p className="text-sm leading-relaxed">{message.content}</p>
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "me" ? "flex-row-reverse" : ""}`}
              onMouseEnter={() => setHoveredMessageId(message.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {message.sender === "other" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                  {message.avatar || message.senderName?.charAt(0)}
                </div>
              )}
              <div className={`flex flex-col ${message.sender === "me" ? "items-end" : "items-start"} max-w-[70%]`}>
                {message.sender === "other" && message.senderName && (
                  <span className="text-xs text-muted-foreground mb-1 px-1">{message.senderName}</span>
                )}
                <div className="relative group">
                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="min-w-[300px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(message.id)}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        {message.replyTo && (
                          <div className="mb-2 pb-2 border-b border-current/20">
                            <p className="text-xs opacity-70 font-medium">{message.replyTo.senderName || "Usuario"}</p>
                            <p className="text-xs opacity-70 truncate">{message.replyTo.content}</p>
                          </div>
                        )}
                        {renderMessageContent(message)}
                      </div>
                      {hoveredMessageId === message.id && (
                        <div
                          className={`absolute -top-3 ${message.sender === "me" ? "right-0" : "left-0"} opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                          <MessageActions
                            onReply={() => handleReply(message)}
                            onEdit={() => handleEdit(message)}
                            onDelete={() => handleDelete(message.id)}
                            onCopy={() => handleCopy(message.content)}
                            isOwnMessage={message.sender === "me"}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-1">{message.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 bg-card">
        <div className="max-w-4xl mx-auto">
          {replyingTo && (
            <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  Respondiendo a {replyingTo.senderName || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
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
                  {attachment.type.startsWith("audio/") && <Mic className="h-6 w-6" />}
                  {attachment.type.startsWith("video/") && <Video className="h-6 w-6" />}
                  {!attachment.type.startsWith("audio/") && !attachment.type.startsWith("video/") && (
                    <File className="h-6 w-6" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={removeAttachment}>
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
            <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10 min-h-[44px]"
              />
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2">
                <Smile className="h-5 w-5" />
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="flex-shrink-0"
              disabled={!newMessage.trim() && !attachment}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <ChatSettings open={showSettings} onOpenChange={onShowSettingsChange} />
    </div>
  )
}
