"use client"

import { useState } from "react"
import { ChatSidebar } from "./chat-sidebar"
import { ChatConversation } from "./chat-conversation"
import { ChatToolbar } from "./chat-toolbar"
import { ThemeToggle } from "./theme-toggle"
import { Menu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Agent } from "../../types/Agent"

export type ChatType = "user" | "agent"

export interface Chat {
  id: string
  name: string
  type: ChatType
  lastMessage: string
  timestamp: string
  unread?: number
  avatar?: string
  online?: boolean
}

export interface Message {
  id: string
  content: string
  sender: "me" | "other"
  timestamp: string
  senderName?: string
  avatar?: string
}

export function ChatInterface() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 border-r border-border overflow-hidden`}
      >
        <ChatSidebar selectedChat={selectedChat} onSelectChat={setSelectedChat} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            {selectedChat && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {/* {selectedChat.avatar || selectedChat.name.charAt(0)} */} X
                  </div>
                  {selectedChat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{selectedChat.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedChat.type === "agent" ? "Agente" : "Usuario"}
                    {selectedChat.online && " • En línea"}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedChat && (
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                <Settings className="h-5 w-5" />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-hidden">
          {selectedChat ? (
            <ChatConversation 
              chat={selectedChat} 
              showSettings={showSettings} 
              onShowSettingsChange={setShowSettings}
              selectedAgent={selectedAgent}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Bienvenido a SYSGD-CHAT</h3>
                <p className="text-sm">Selecciona una conversación para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <ChatToolbar 
        selectedChat={selectedChat}
        onGoHome={() => setSelectedChat(null)}
        onAgentSelect={setSelectedAgent}
      />
    </div>
  )
}
