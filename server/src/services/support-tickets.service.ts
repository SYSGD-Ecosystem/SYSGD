import { pool } from "../db";
import { EmailService } from "./emailService";
import { geminiAgent } from "../geminiAgent";
import { openRouterAgent } from "../openRouterAgent";

export class SupportTicketsServiceError extends Error {
	readonly status: number;
	readonly payload: { error: string };

	constructor(status: number, message: string) {
		super(message);
		this.name = "SupportTicketsServiceError";
		this.status = status;
		this.payload = { error: message };
	}
}

export type SupportTicketStatus = "open" | "closed";
export type SupportEmailStatus = "pending" | "sent" | "failed";

export interface SupportTicket {
	id: string;
	user_id: string | null;
	recipient_email: string;
	recipient_name: string | null;
	subject: string;
	message: string;
	status: SupportTicketStatus;
	email_status: SupportEmailStatus;
	created_by: string | null;
	created_at: string;
}

export interface CreateSupportTicketInput {
	email?: unknown;
	name?: unknown;
	subject?: unknown;
	message?: unknown;
}

export interface ListSupportTicketsInput {
	page?: unknown;
	pageSize?: unknown;
	q?: unknown;
	status?: unknown;
}

export interface SupportTicketsSummary {
	total: number;
	open: number;
	closed: number;
}

export interface SupportTicketsPage {
	tickets: SupportTicket[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
	summary: SupportTicketsSummary;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ParsedCreateInput {
	email: string;
	name: string;
	subject: string;
	message: string;
}

function parseCreateInput(input: CreateSupportTicketInput): ParsedCreateInput {
	const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
	const name = typeof input.name === "string" ? input.name.trim() : "";
	const subject = typeof input.subject === "string" ? input.subject.trim() : "";
	const message = typeof input.message === "string" ? input.message.trim() : "";

	if (!email) {
		throw new SupportTicketsServiceError(400, "El correo del destinatario es requerido");
	}
	if (email.length > 254 || !EMAIL_REGEX.test(email)) {
		throw new SupportTicketsServiceError(400, "El correo del destinatario no es válido");
	}
	if (name.length > 150) {
		throw new SupportTicketsServiceError(400, "El nombre del destinatario es demasiado largo");
	}
	if (subject.length < 3 || subject.length > 150) {
		throw new SupportTicketsServiceError(
			400,
			"El asunto debe tener entre 3 y 150 caracteres",
		);
	}
	if (message.length < 10 || message.length > 5000) {
		throw new SupportTicketsServiceError(
			400,
			"El mensaje debe tener entre 10 y 5000 caracteres",
		);
	}

	return { email, name, subject, message };
}

export interface ImproveMessageInput {
	message: string;
	subject?: string;
	provider?: unknown;
	model?: unknown;
	customToken?: string;
}

export class SupportTicketsService {
	static async create(
		input: CreateSupportTicketInput,
		adminId: string,
	): Promise<SupportTicket> {
		const data = parseCreateInput(input);

		const userResult = await pool.query<{ id: string; name: string | null }>(
			"SELECT id, name FROM users WHERE LOWER(email) = $1",
			[data.email],
		);
		const matchedUser = userResult.rows[0];
		const recipientName = data.name || matchedUser?.name || null;

		const inserted = await pool.query<SupportTicket>(
			`INSERT INTO support_tickets (
				user_id, recipient_email, recipient_name, subject, message, status, email_status, created_by
			) VALUES ($1, $2, $3, $4, $5, 'open', 'pending', $6)
			RETURNING *`,
			[matchedUser?.id ?? null, data.email, recipientName, data.subject, data.message, adminId],
		);
		const ticket = inserted.rows[0];

		const sent = await EmailService.sendSupportEmail(
			data.email,
			recipientName ?? "",
			data.subject,
			data.message,
		);

		const updated = await pool.query<SupportTicket>(
			"UPDATE support_tickets SET email_status = $2 WHERE id = $1 RETURNING *",
			[ticket.id, sent ? "sent" : "failed"],
		);

		await pool.query(
			`INSERT INTO email_notifications (
				user_id, recipient_email, subject, type, status, sent_at
			) VALUES ($1, $2, $3, $4, $5, $6)`,
			[
				matchedUser?.id ?? null,
				data.email,
				data.subject,
				"support_ticket",
				sent ? "sent" : "failed",
				sent ? new Date() : null,
			],
		);

		return updated.rows[0];
	}

	static async list(input: ListSupportTicketsInput): Promise<SupportTicketsPage> {
		const parsedPage = Number.parseInt(String(input.page ?? "1"), 10);
		const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
		const parsedPageSize = Number.parseInt(String(input.pageSize ?? "20"), 10);
		const pageSize =
			Number.isNaN(parsedPageSize) || parsedPageSize < 1
				? 20
				: Math.min(100, parsedPageSize);
		const q =
			typeof input.q === "string" && input.q.trim() ? input.q.trim() : null;
		const status =
			input.status === "open" || input.status === "closed" ? input.status : null;
		const offset = (page - 1) * pageSize;

		const whereClause = `
			WHERE ($1::text IS NULL OR recipient_email ILIKE '%' || $1 || '%' OR recipient_name ILIKE '%' || $1 || '%' OR subject ILIKE '%' || $1 || '%')
			  AND ($2::text IS NULL OR status = $2::text)
		`;

		const [ticketsResult, countResult, summaryResult] = await Promise.all([
			pool.query<SupportTicket>(
				`SELECT * FROM support_tickets
				${whereClause}
				ORDER BY created_at DESC
				LIMIT $3 OFFSET $4`,
				[q, status, pageSize, offset],
			),
			pool.query<{ total: string }>(
				`SELECT COUNT(*) AS total FROM support_tickets ${whereClause}`,
				[q, status],
			),
			pool.query<{ open: string; closed: string }>(
				`SELECT
					COUNT(*) FILTER (WHERE status = 'open') AS open,
					COUNT(*) FILTER (WHERE status = 'closed') AS closed
				FROM support_tickets`,
			),
		]);

		const total = Number(countResult.rows[0].total);
		const open = Number(summaryResult.rows[0].open);
		const closed = Number(summaryResult.rows[0].closed);

		return {
			tickets: ticketsResult.rows,
			total,
			page,
			pageSize,
			totalPages: Math.max(1, Math.ceil(total / pageSize)),
			summary: { total: open + closed, open, closed },
		};
	}

	static async updateStatus(id: string, status: unknown): Promise<SupportTicket> {
		if (!UUID_REGEX.test(id)) {
			throw new SupportTicketsServiceError(400, "ID de ticket inválido");
		}
		if (status !== "open" && status !== "closed") {
			throw new SupportTicketsServiceError(
				400,
				"Estado inválido: debe ser 'open' o 'closed'",
			);
		}

		const result = await pool.query<SupportTicket>(
			"UPDATE support_tickets SET status = $2 WHERE id = $1 RETURNING *",
			[id, status],
		);

		if (result.rowCount === 0) {
			throw new SupportTicketsServiceError(404, "Ticket de soporte no encontrado");
		}

		return result.rows[0];
	}

	static async improveMessage(input: ImproveMessageInput): Promise<{ respuesta: string }> {
		const message = input.message.trim();
		const subject = input.subject?.trim() ?? "";
		const provider = input.provider === "openrouter" ? "openrouter" : "gemini";
		const model =
			typeof input.model === "string" && input.model.trim()
				? input.model.trim()
				: "gemini-2.5-flash";

		const prompt = [
			"Mejora y profesionaliza el siguiente mensaje de soporte que un administrador enviará por correo a un usuario de la plataforma.",
			subject ? `Asunto actual: ${subject}` : "",
			"Mensaje actual:",
			message,
			"Requisitos:",
			"- Corrige ortografía, gramática y puntuación",
			"- Tono claro, amable y profesional, orientado a resolver la duda del usuario",
			"- No inventes funcionalidades ni prometas nada que no exista",
			"- No agregues saludos, despedidas ni firmas",
			"- Devuelve SOLO el texto mejorado en texto plano, sin Markdown ni explicaciones",
		]
			.filter(Boolean)
			.join("\n");

		const systemPrompt =
			"Eres un especialista en atención al soporte de una plataforma SaaS. Mejoras y profesionalizas mensajes de soporte dirigidos a usuarios finales sin inventar funcionalidades ni promesas. Devuelve SOLO el texto mejorado en texto plano, sin Markdown ni comentarios adicionales.";

		const result =
			provider === "gemini"
				? await geminiAgent({
						prompt,
						model,
						customToken: input.customToken,
						systemPrompt,
						forse_text_response: true,
					})
				: await openRouterAgent({
						prompt,
						model,
						customToken: input.customToken,
						systemPrompt,
						force_text_response: true,
					});

		return { respuesta: result.respuesta };
	}
}
