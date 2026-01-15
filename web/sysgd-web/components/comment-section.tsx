/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: <explanation> */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { MessageCircle, ThumbsUp, Reply } from "lucide-react"
import { cn } from "@/lib/utils"

interface Comment {
  id: number
  author_name: string
  author_email: string
  content: string
  created_at: string
  reactions: {
    like: number
    dislike: number
  }
  replies: Comment[]
}

interface CommentSectionProps {
  postSlug: string
}

export function CommentSection({ postSlug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState({
    author_name: "",
    author_email: "",
    content: "",
  })
  const [replyingTo, setReplyingTo] = useState<number | null>(null)

  useEffect(() => {
    fetchComments()
  }, [postSlug])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/news/updates/${postSlug}/comments`)
      const result = await response.json()

      if (result.success) {
        setComments(result.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent, parentId: number | null = null) => {
    e.preventDefault()

    if (!newComment.author_name || !newComment.author_email || !newComment.content) {
      return
    }

    try {
      const response = await fetch(`/api/news/updates/${postSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newComment,
          parent_comment_id: parentId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setNewComment({ author_name: "", author_email: "", content: "" })
        setReplyingTo(null)
        // In production, you might want to refetch or optimistically update
        alert("Comentario enviado. Pendiente de aprobación.")
      }
    } catch (error) {
      console.error("[v0] Error submitting comment:", error)
    }
  }

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const formattedDate = new Date(comment.created_at).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

    return (
      <div className={cn("space-y-3", depth > 0 && "ml-12")}>
        <Card className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>{comment.author_name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{comment.author_name}</span>
                <span className="text-sm text-muted-foreground">{formattedDate}</span>
              </div>

              <p className="text-sm mb-3">{comment.content}</p>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {comment.reactions.like > 0 && comment.reactions.like}
                </Button>

                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setReplyingTo(comment.id)}>
                  <Reply className="w-3 h-3" />
                  Responder
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <Card className="p-4 ml-12">
            <form onSubmit={(e) => handleSubmitComment(e, comment.id)} className="space-y-3">
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={newComment.content}
                onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Enviar respuesta
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        Comentarios ({comments.length})
      </h2>

      {/* New comment form */}
      <Card className="p-6 mb-8">
        <form onSubmit={(e) => handleSubmitComment(e)} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Tu nombre"
              value={newComment.author_name}
              onChange={(e) => setNewComment({ ...newComment, author_name: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Tu email"
              value={newComment.author_email}
              onChange={(e) => setNewComment({ ...newComment, author_email: e.target.value })}
              required
            />
          </div>
          <Textarea
            placeholder="Escribe tu comentario..."
            value={newComment.content}
            onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
            rows={4}
            required
          />
          <Button type="submit">Publicar comentario</Button>
        </form>
      </Card>

      {/* Comments list */}
      {loading ? (
        <p className="text-muted-foreground">Cargando comentarios...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">Sé el primero en comentar este artículo</p>
      )}
    </div>
  )
}
