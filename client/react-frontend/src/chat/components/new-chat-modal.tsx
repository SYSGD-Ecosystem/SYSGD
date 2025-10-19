"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, User, Bot } from "lucide-react"

interface NewChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectContact: (contact: Contact) => void
}

interface Contact {
  id: string
  name: string
  email: string
  username: string
  type: "user" | "agent"
  avatar: string
  online: boolean
}

// Mock contacts
const mockContacts: Contact[] = [
  {
    id: "u1",
    name: "María González",
    email: "maria.gonzalez@example.com",
    username: "@mgonzalez",
    type: "user",
    avatar: "MG",
    online: true,
  },
  {
    id: "u2",
    name: "Carlos Ramírez",
    email: "carlos.ramirez@example.com",
    username: "@cramirez",
    type: "user",
    avatar: "CR",
    online: false,
  },
  {
    id: "u3",
    name: "Ana Martínez",
    email: "ana.martinez@example.com",
    username: "@amartinez",
    type: "user",
    avatar: "AM",
    online: false,
  },
  {
    id: "a1",
    name: "Agente Soporte Técnico",
    email: "soporte@sysgd.com",
    username: "@soporte",
    type: "agent",
    avatar: "🤖",
    online: true,
  },
  {
    id: "a2",
    name: "Agente Ventas",
    email: "ventas@sysgd.com",
    username: "@ventas",
    type: "agent",
    avatar: "💼",
    online: true,
  },
]

export function NewChatModal({ open, onOpenChange, onSelectContact }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredContacts = mockContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectContact = (contact: Contact) => {
    onSelectContact(contact)
    setSearchQuery("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Conversación</DialogTitle>
          <DialogDescription>Busca por nombre de usuario, correo electrónico o nombre</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contacto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Contacts List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No se encontraron contactos</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <button
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
                          <h4 className="font-semibold text-sm truncate">{contact.name}</h4>
                          {contact.type === "agent" ? (
                            <Bot className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{contact.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
