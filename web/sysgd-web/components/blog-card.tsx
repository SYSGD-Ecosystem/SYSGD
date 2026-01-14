import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, MessageCircle, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface BlogCardProps {
  post: {
    id: number
    slug: string
    title: string
    description: string
    category: string
    author_name: string
    author_avatar: string
    featured_image: string
    published_date: string
    views_count: number
    reactions: {
      like: number
      love: number
      fire: number
      clap: number
      thinking: number
    }
    comments_count: number
  }
}

export function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.published_date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Featured image */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={post.featured_image || "/placeholder.svg"}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-4 left-4" variant="secondary">
          {post.category}
        </Badge>
      </div>

      <div className="p-6">
        {/* Meta info */}
        <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.views_count}
          </div>
        </div>

        {/* Title and description */}
        <Link href={`/updates/${post.slug}`}>
          <h3 className="text-xl font-bold mb-2 text-balance hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        <p className="text-muted-foreground mb-4 line-clamp-3 text-pretty">{post.description}</p>

        {/* Author and stats */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={post.author_avatar || "/placeholder.svg"} alt={post.author_name} />
              <AvatarFallback>{post.author_name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{post.author_name}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{totalReactions} reacciones</span>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post.comments_count}
            </div>
          </div>
        </div>

        {/* Read more button */}
        <Link href={`/updates/${post.slug}`}>
          <Button className="w-full mt-4 bg-transparent" variant="outline">
            Leer más
          </Button>
        </Link>
      </div>
    </Card>
  )
}
