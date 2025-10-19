"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, User, Bot, Link2, Copy, Check, UserPlus } from "lucide-react"
import { Label } from "@/components/ui/label"

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
  isPublic?: boolean
}

const mockPublicContacts: Contact[] = [
  {
    id: "a1",
    name: "Agente Soporte Técnico",
    email: "soporte@sysgd.com",
    username: "@soporte",
    type: "agent",
    avatar: "🤖",
    online: true,
    isPublic: true,
  },
  {
    id: "a2",
    name: "Agente Ventas",
    email: "ventas@sysgd.com",
    username: "@ventas",
    type: "agent",
    avatar: "💼",
    online: true,
    isPublic: true,
  },
  {
    id: "u1",
    name: "María González",
    email: "maria.gonzalez@example.com",
    username: "@mgonzalez",
    type: "user",
    avatar: "MG",
    online: true,
    isPublic: true,
  },
]

export function NewChatModal({ open, onOpenChange, onSelectContact }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [generatedLink, setGeneratedLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const filteredContacts = mockPublicContacts.filter(
    (contact) =>
      contact.isPublic &&
      (contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleSelectContact = (contact: Contact) => {
    onSelectContact(contact)
    setSearchQuery("")
    onOpenChange(false)
  }

  const handleUseInviteLink = () => {
    if (!inviteLink.trim()) return

    // Aquí iría la lógica para validar y usar el link de invitación
    // Por ahora simulamos agregar un contacto
    const newContact: Contact = {
      id: "invited-" + Date.now(),
      name: "Usuario Invitado",
      email: "invitado@example.com",
      username: "@invitado",
      type: "user",
      avatar: "UI",
      online: false,
      isPublic: false,
    }

    onSelectContact(newContact)
    setInviteLink("")
    onOpenChange(false)
  }

  const handleGenerateLink = () => {
    const link = `https://sysgd.app/invite/${Math.random().toString(36).substring(7)}`
    setGeneratedLink(link)
  }

  const handleCopyGeneratedLink = () => {
    navigator.clipboard.writeText(generatedLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Nueva Conversación</DialogTitle>
          <DialogDescription>Selecciona un usuario público o usa un link de invitación</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="public">Usuarios Públicos</TabsTrigger>
            <TabsTrigger value="invite">Usar Link</TabsTrigger>
            <TabsTrigger value="generate">Generar Link</TabsTrigger>
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
                    <p className="font-medium">No se encontraron usuarios públicos</p>
                    <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
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
                <Label htmlFor="invite-link">Link de Invitación</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="invite-link"
                      placeholder="https://sysgd.app/invite/..."
                      value={inviteLink}
                      onChange={(e) => setInviteLink(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleUseInviteLink} disabled={!inviteLink.trim()}>
                    Usar Link
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  ¿Cómo funciona?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Pega el link de invitación que te compartieron</li>
                  <li>El usuario se agregará a tus contactos disponibles</li>
                  <li>Podrás iniciar una conversación inmediatamente</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Tu Link de Invitación</Label>
                <p className="text-sm text-muted-foreground">
                  Genera un link para que otros usuarios puedan agregarte y chatear contigo
                </p>
              </div>

              {!generatedLink ? (
                <Button onClick={handleGenerateLink} className="w-full" size="lg">
                  <Link2 className="h-4 w-4 mr-2" />
                  Generar Link de Invitación
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={generatedLink} readOnly className="font-mono text-sm" />
                    <Button onClick={handleCopyGeneratedLink} variant="outline" size="icon">
                      {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {linkCopied && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Link copiado al portapapeles
                    </p>
                  )}
                  <Button onClick={handleGenerateLink} variant="outline" className="w-full bg-transparent">
                    Generar Nuevo Link
                  </Button>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Comparte tu link
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Comparte este link con quien quieras chatear</li>
                  <li>El link es único y personal</li>
                  <li>Puedes generar un nuevo link en cualquier momento</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
