import { type NextRequest, NextResponse } from "next/server"

// This would connect to your actual database - for now using mock data structure

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const offset = Number.parseInt(searchParams.get("offset") || "0")
  const category = searchParams.get("category")

  try {
    // TODO: Replace with actual database query
    // Example: const posts = await db.query('SELECT * FROM blog_posts WHERE is_published = true ORDER BY published_date DESC LIMIT $1 OFFSET $2', [limit, offset])

    const mockPosts = [
      {
        id: 1,
        slug: "integracion-github-rastreo",
        title: "Integración con GitHub para Rastreo de Actividad",
        description:
          "Nueva integración que permite conectar repositorios de GitHub para obtener información detallada de Pull Requests.",
        content: "## Integración con GitHub...",
        category: "Nueva Funcionalidad",
        author_name: "Equipo SYSGD",
        author_avatar: "/developer-avatar.png",
        author_role: "Development Team",
        featured_image: "/github-integration.jpg",
        published_date: "2025-12-22T10:00:00Z",
        views_count: 156,
        reactions: {
          like: 24,
          love: 12,
          fire: 8,
          clap: 15,
          thinking: 3,
        },
        comments_count: 7,
      },
      {
        id: 2,
        slug: "dinamizacion-tareas-editor",
        title: "Dinamización de Tareas y Editor Mejorado",
        description:
          "Mejoras sustanciales en el sistema de tareas con tipos dinámicos, Markdown y soporte de imágenes.",
        content: "## Dinamización de Tareas...",
        category: "Mejora",
        author_name: "Equipo SYSGD",
        author_avatar: "/developer-avatar.png",
        author_role: "Development Team",
        featured_image: "/markdown-editor-interface.png",
        published_date: "2025-12-22T09:00:00Z",
        views_count: 203,
        reactions: {
          like: 45,
          love: 21,
          fire: 12,
          clap: 28,
          thinking: 5,
        },
        comments_count: 12,
      },
      {
        id: 3,
        slug: "lanzamiento-pagina-institucional",
        title: "Lanzamiento de la Página Institucional",
        description: "Presentamos la nueva página institucional pública de SYSGD Ecosystem.",
        content: "## Lanzamiento de la Página Institucional...",
        category: "Anuncio",
        author_name: "Equipo SYSGD",
        author_avatar: "/developer-avatar.png",
        author_role: "Development Team",
        featured_image: "/institutional-website.jpg",
        published_date: "2025-12-21T14:00:00Z",
        views_count: 342,
        reactions: {
          like: 67,
          love: 34,
          fire: 23,
          clap: 45,
          thinking: 8,
        },
        comments_count: 19,
      },
    ]

    // Filter by category if provided
    const filteredPosts = category ? mockPosts.filter((post) => post.category === category) : mockPosts

    // Pagination
    const paginatedPosts = filteredPosts.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedPosts,
      pagination: {
        total: filteredPosts.length,
        limit,
        offset,
        hasMore: offset + limit < filteredPosts.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching blog posts:", error)
    return NextResponse.json({ success: false, error: "Error al obtener las publicaciones" }, { status: 500 })
  }
}
