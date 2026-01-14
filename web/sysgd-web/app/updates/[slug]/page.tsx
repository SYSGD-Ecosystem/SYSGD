"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CommentSection } from "@/components/comment-section"
import { ReactionBar } from "@/components/reaction-bar"
import { useState, useEffect } from "react"
import { Calendar, Eye, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import ReactMarkdown from "react-markdown"

interface BlogPost {
  id: number
  slug: string
  title: string
  description: string
  content: string
  category: string
  author_name: string
  author_avatar: string
  author_role: string
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
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [params.slug])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/news/updates/${params.slug}`)
      const result = await response.json()

      if (result.success) {
        setPost(result.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching blog post:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-64 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
            <h1 className="text-3xl font-bold mb-4">Publicación no encontrada</h1>
            <Link href="/updates">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Blog
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const formattedDate = new Date(post.published_date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-12 md:py-16">
        <article className="container mx-auto px-4 md:px-6 max-w-4xl">
          <Link href="/updates">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Blog
            </Button>
          </Link>

          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{post.category}</Badge>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.views_count} vistas
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">{post.title}</h1>

            <div className="flex items-center gap-3 mb-6">
              <Avatar>
                <AvatarImage src={post.author_avatar || "/placeholder.svg"} alt={post.author_name} />
                <AvatarFallback>{post.author_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.author_name}</p>
                <p className="text-sm text-muted-foreground">{post.author_role}</p>
              </div>
            </div>

            {/* Featured image */}
            {post.featured_image && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
                <Image
                  src={post.featured_image || "/placeholder.svg"}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </header>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          <ReactionBar postSlug={post.slug} initialReactions={post.reactions} />

          <CommentSection postSlug={post.slug} />
        </article>
      </main>
      <Footer />
    </div>
  )
}
