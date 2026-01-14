"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Flame, Hand, Brain, ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReactionBarProps {
  postSlug: string
  initialReactions: {
    like: number
    love: number
    fire: number
    clap: number
    thinking: number
  }
}

export function ReactionBar({ postSlug, initialReactions }: ReactionBarProps) {
  const [reactions, setReactions] = useState(initialReactions)
  const [userReaction, setUserReaction] = useState<string | null>(null)

  const reactionButtons = [
    { type: "like", icon: ThumbsUp, label: "Me gusta", color: "text-blue-500" },
    { type: "love", icon: Heart, label: "Me encanta", color: "text-red-500" },
    { type: "fire", icon: Flame, label: "Increíble", color: "text-orange-500" },
    { type: "clap", icon: Hand, label: "Aplausos", color: "text-yellow-500" },
    { type: "thinking", icon: Brain, label: "Interesante", color: "text-purple-500" },
  ]

  const handleReaction = async (reactionType: string) => {
    const isRemoving = userReaction === reactionType

    try {
      // TODO: Get user email from session/auth
      const userEmail = "user@example.com"
      const userName = "Usuario"

      if (isRemoving) {
        // Remove reaction
        await fetch(`/api/news/updates/${postSlug}/reactions?reaction_type=${reactionType}&user_email=${userEmail}`, {
          method: "DELETE",
        })

        setReactions((prev) => ({
          ...prev,
          [reactionType]: Math.max(0, prev[reactionType as keyof typeof prev] - 1),
        }))
        setUserReaction(null)
      } else {
        // Add reaction
        await fetch(`/api/news/updates/${postSlug}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction_type: reactionType, user_email: userEmail, user_name: userName }),
        })

        // If user had previous reaction, decrease it
        if (userReaction) {
          setReactions((prev) => ({
            ...prev,
            [userReaction]: Math.max(0, prev[userReaction as keyof typeof prev] - 1),
            [reactionType]: prev[reactionType as keyof typeof prev] + 1,
          }))
        } else {
          setReactions((prev) => ({
            ...prev,
            [reactionType]: prev[reactionType as keyof typeof prev] + 1,
          }))
        }

        setUserReaction(reactionType)
      }
    } catch (error) {
      console.error("[v0] Error handling reaction:", error)
    }
  }

  return (
    <div className="border-y py-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">¿Qué te pareció este artículo?</h3>
      <div className="flex flex-wrap gap-3">
        {reactionButtons.map(({ type, icon: Icon, label, color }) => {
          const count = reactions[type as keyof typeof reactions]
          const isActive = userReaction === type

          return (
            <Button
              key={type}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleReaction(type)}
              className={cn("gap-2 transition-all", isActive && "shadow-md")}
            >
              <Icon className={cn("w-4 h-4", isActive && color)} />
              <span>{label}</span>
              {count > 0 && <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium">{count}</span>}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
