import { type NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	context: { params: { slug: string } }, // <-- **no desestructurar aquí**
): Promise<NextResponse> {
	const { slug } = context.params; // <-- desestructuramos dentro del cuerpo
	console.log("[GET] slug:", slug);

	try {
		// TODO: Replace with actual database query
		const mockComments = [
			{
				id: 1,
				post_id: 1,
				parent_comment_id: null,
				author_name: "María González",
				author_email: "maria@example.com",
				content:
					"¡Excelente integración! Justo lo que necesitábamos para nuestro equipo.",
				is_approved: true,
				created_at: "2025-12-22T11:30:00Z",
				reactions: {
					like: 5,
					dislike: 0,
				},
				replies: [],
			},
			{
				id: 2,
				post_id: 1,
				parent_comment_id: null,
				author_name: "Carlos Ramírez",
				author_email: "carlos@example.com",
				content: "¿Es posible integrar con GitLab también?",
				is_approved: true,
				created_at: "2025-12-22T12:15:00Z",
				reactions: {
					like: 3,
					dislike: 0,
				},
				replies: [
					{
						id: 3,
						post_id: 1,
						parent_comment_id: 2,
						author_name: "Equipo SYSGD",
						author_email: "team@sysgd.com",
						content:
							"Sí, estamos trabajando en la integración con GitLab. Esperamos lanzarla pronto.",
						is_approved: true,
						created_at: "2025-12-22T13:00:00Z",
						reactions: {
							like: 8,
							dislike: 0,
						},
						replies: [],
					},
				],
			},
		];

		return NextResponse.json({
			success: true,
			data: mockComments,
		});
	} catch (error) {
		console.error("[v0] Error fetching comments:", error);
		return NextResponse.json(
			{ success: false, error: "Error al obtener los comentarios" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: NextRequest,
	context: { params: { slug: string } },
): Promise<NextResponse> {
	const { slug } = context.params;
	console.log("[POST] slug:", slug);

	try {
		const body = await request.json();
		const { author_name, author_email, content, parent_comment_id } = body;

		// Validation
		if (!author_name || !author_email || !content) {
			return NextResponse.json(
				{ success: false, error: "Todos los campos son requeridos" },
				{ status: 400 },
			);
		}

		// TODO: Insert comment into database
		// const result = await db.query(...)

		const newComment = {
			id: Date.now(),
			author_name,
			author_email,
			content,
			parent_comment_id: parent_comment_id || null,
			is_approved: false, // Requires moderation
			created_at: new Date().toISOString(),
			reactions: { like: 0, dislike: 0 },
		};

		return NextResponse.json(
			{
				success: true,
				data: newComment,
				message: "Comentario enviado. Pendiente de aprobación.",
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("[v0] Error creating comment:", error);
		return NextResponse.json(
			{ success: false, error: "Error al crear el comentario" },
			{ status: 500 },
		);
	}
}
