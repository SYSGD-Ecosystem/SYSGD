import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug

  try {
    const body = await request.json()
    const { reaction_type, user_email, user_name } = body

    // Validation
    const validReactions = ["like", "love", "fire", "clap", "thinking"]
    if (!validReactions.includes(reaction_type)) {
      return NextResponse.json({ success: false, error: "Tipo de reacción no válido" }, { status: 400 })
    }

    if (!user_email) {
      return NextResponse.json({ success: false, error: "Email es requerido" }, { status: 400 })
    }

    // TODO: Insert or update reaction in database
    // Check if user already reacted with same type, if so remove it (toggle behavior)

    return NextResponse.json({
      success: true,
      message: "Reacción registrada",
    })
  } catch (error) {
    console.error("[v0] Error creating reaction:", error)
    return NextResponse.json({ success: false, error: "Error al registrar la reacción" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug

  try {
    const searchParams = request.nextUrl.searchParams
    const reaction_type = searchParams.get("reaction_type")
    const user_email = searchParams.get("user_email")

    if (!reaction_type || !user_email) {
      return NextResponse.json({ success: false, error: "Parámetros faltantes" }, { status: 400 })
    }

    // TODO: Delete reaction from database

    return NextResponse.json({
      success: true,
      message: "Reacción eliminada",
    })
  } catch (error) {
    console.error("[v0] Error deleting reaction:", error)
    return NextResponse.json({ success: false, error: "Error al eliminar la reacción" }, { status: 500 })
  }
}
