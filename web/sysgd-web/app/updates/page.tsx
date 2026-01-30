"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogCard } from "@/components/blog-card"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface BlogPost {
  id: number
  slug: string
  title: string
  description: string
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
  comments_count: number
}

export default function UpdatesPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const url = selectedCategory
        ? `/api/news/updates?category=${encodeURIComponent(selectedCategory)}`
        : "/api/news/updates"

      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setPosts(result.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching blog posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ["Todas", "Anuncio", "Nueva Funcionalidad", "Mejora", "Documentación", "Seguridad"]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Blog de Actualizaciones</h1>
            <p className="text-lg text-muted-foreground text-pretty mb-8">
              Mantente al día con los últimos avances, nuevas funcionalidades y mejoras del ecosistema SYSGD.
            </p>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={
                    (category === "Todas" && !selectedCategory) || selectedCategory === category ? "default" : "outline"
                  }
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => setSelectedCategory(category === "Todas" ? null : category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-8 max-w-5xl mx-auto md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid gap-8 max-w-5xl mx-auto md:grid-cols-2">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay publicaciones en esta categoría.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
