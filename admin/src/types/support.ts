export type SupportTicketStatus = "open" | "closed"

export type SupportEmailStatus = "pending" | "sent" | "failed"

export interface SupportTicket {
	id: string
	user_id: string | null
	recipient_email: string
	recipient_name: string | null
	subject: string
	message: string
	status: SupportTicketStatus
	email_status: SupportEmailStatus
	created_by: string | null
	created_at: string
}

export interface SupportTicketsSummary {
	total: number
	open: number
	closed: number
}

export interface SupportTicketsPage {
	tickets: SupportTicket[]
	total: number
	page: number
	pageSize: number
	totalPages: number
	summary: SupportTicketsSummary
}

export interface CreateSupportTicketData {
	email: string
	name?: string
	subject: string
	message: string
}
