import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type {
	CreateSupportTicketData,
	SupportTicket,
	SupportTicketsSummary,
	SupportTicketStatus,
	SupportTicketsPage,
} from "../../types/support"

type UseSupportTicketsReturn = {
	tickets: SupportTicket[]
	loading: boolean
	error: string | null
	page: number
	pageSize: number
	total: number
	totalPages: number
	summary: SupportTicketsSummary
	search: string
	statusFilter: SupportTicketStatus | "all"
	setSearch: (value: string) => void
	setStatusFilter: (value: SupportTicketStatus | "all") => void
	setPage: (page: number) => void
	setPageSize: (size: number) => void
	refetch: () => void
	createTicket: (data: CreateSupportTicketData) => Promise<SupportTicket>
	updateTicketStatus: (id: string, status: SupportTicketStatus) => Promise<void>
}

const EMPTY_SUMMARY: SupportTicketsSummary = { total: 0, open: 0, closed: 0 }

export function useSupportTickets(initialPageSize: number = 20): UseSupportTicketsReturn {
	const [tickets, setTickets] = useState<SupportTicket[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState(initialPageSize)
	const [search, setSearch] = useState("")
	const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "all">("all")
	const [total, setTotal] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [summary, setSummary] = useState<SupportTicketsSummary>(EMPTY_SUMMARY)

	const fetchTickets = useCallback(async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			params.set("page", String(page))
			params.set("pageSize", String(pageSize))
			if (search.trim()) {
				params.set("q", search.trim())
			}
			if (statusFilter !== "all") {
				params.set("status", statusFilter)
			}
			const data = await apiFetch<SupportTicketsPage>(
				`/api/admin/support/tickets?${params.toString()}`,
			)
			setTickets(data.tickets)
			setTotal(data.total)
			setTotalPages(data.totalPages)
			setSummary(data.summary)
			setError(null)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Error al obtener los tickets"
			setError(message)
		} finally {
			setLoading(false)
		}
	}, [page, pageSize, search, statusFilter])

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			void fetchTickets()
		}, 300)
		return () => clearTimeout(timeoutId)
	}, [fetchTickets])

	const handleSearchChange = (value: string) => {
		setSearch(value)
		setPage(1)
	}

	const handleStatusFilterChange = (value: SupportTicketStatus | "all") => {
		setStatusFilter(value)
		setPage(1)
	}

	const createTicket = async (data: CreateSupportTicketData): Promise<SupportTicket> => {
		const created = await apiFetch<SupportTicket>("/api/admin/support/tickets", {
			method: "POST",
			body: JSON.stringify(data),
		})
		await fetchTickets()
		return created
	}

	const updateTicketStatus = async (id: string, status: SupportTicketStatus) => {
		await apiFetch<SupportTicket>(`/api/admin/support/tickets/${id}/status`, {
			method: "PATCH",
			body: JSON.stringify({ status }),
		})
		await fetchTickets()
	}

	return {
		tickets,
		loading,
		error,
		page,
		pageSize,
		total,
		totalPages,
		summary,
		search,
		statusFilter,
		setSearch: handleSearchChange,
		setStatusFilter: handleStatusFilterChange,
		setPage,
		setPageSize,
		refetch: fetchTickets,
		createTicket,
		updateTicketStatus,
	}
}
