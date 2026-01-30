import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug

  try {
    // TODO: Replace with actual database query
    // Example: const post = await db.query('SELECT * FROM blog_posts WHERE slug = $1 AND is_published = true', [slug])

    const mockPost = {
      id: 1,
      slug: "integracion-github-rastreo",
      title: "Integración con GitHub para Rastreo de Actividad",
      description:
        "Nueva integración que permite conectar repositorios de GitHub para obtener información detallada de Pull Requests.",
      content: `## Integración con GitHub para Rastreo de Actividad

Estamos emocionados de anunciar una nueva integración que permite conectar repositorios de GitHub para obtener información detallada de Pull Requests: usuario creador, líneas añadidas/eliminadas y archivos modificados.

### Características principales:

- **Rastreo de actividad real**: Monitorea cuánto trabaja cada desarrollador
- **Información detallada de PRs**: Visualiza estadísticas completas
- **Exportación a Excel**: Analiza datos externamente
- **Optimizado para memoria**: No recarga objetos innecesariamente

### Configuración

Cada usuario debe configurar su propio Personal Access Token:

1. Ve a GitHub Settings
2. Developer settings > Personal access tokens
3. Generate new token con permisos \`repo\`
4. Pega el token en SYSGD

Ideal para empresas y pequeños equipos que necesitan rastrear el nivel de actividad real de cada desarrollador.`,
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
    }

    if (!mockPost || mockPost.slug !== slug) {
      return NextResponse.json({ success: false, error: "Publicación no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: mockPost,
    })
  } catch (error) {
    console.error("[v0] Error fetching blog post:", error)
    return NextResponse.json({ success: false, error: "Error al obtener la publicación" }, { status: 500 })
  }
}
