"use client"

import { Button } from "@/components/ui/button"
import { Reply, Edit, Trash2, Copy } from "lucide-react"

interface MessageActionsProps {
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
  isOwnMessage: boolean
}

export function MessageActions({ onReply, onEdit, onDelete, onCopy, isOwnMessage }: MessageActionsProps) {
  return (
    <div className="flex items-center gap-1 bg-background border border-border rounded-lg shadow-lg p-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onReply} title="Responder">
        <Reply className="h-4 w-4" />
      </Button>
      {isOwnMessage && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy} title="Copiar">
        <Copy className="h-4 w-4" />
      </Button>
      {isOwnMessage && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete} title="Eliminar">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
