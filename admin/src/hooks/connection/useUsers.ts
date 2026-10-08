import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type {
	AdminUsersPage,
	CreateUserData,
	UpdateUserData,
	UpdateUserPlanData,
	User,
	UserSegment,
	UserSegments,
} from "../../types/user"

type UseUsersReturn = {
	users: User[]
	loading: boolean
	error: string | null
	page: number
	pageSize: number
	total: number
	totalPages: number
	summary: UserSegments
	search: string
	segment: UserSegment | null
	setSearch: (value: string) => void
	setSegment: (value: UserSegment | null) => void
	setPage: (page: number) => void
	setPageSize: (size: number) => void
	refetch: () => void
	createUser: (data: CreateUserData) => Promise<User>
	updateUser: (id: string, data: UpdateUserData) => Promise<void>
	updateUserPlan: (id: string, data: UpdateUserPlanData) => Promise<void>
	deleteUser: (id: string) => Promise<void>
	toggleUserPublic: (isPublic: boolean) => Promise<void>
}

const EMPTY_SUMMARY: UserSegments = {
	total: 0,
	admins: 0,
	regular: 0,
	free: 0,
	pro: 0,
	vip: 0,
	manualLicenseBuyers: 0,
	trialProActive: 0,
	inactiveOverYear: 0,
}

export function useUsers(initialPageSize: number = 20): UseUsersReturn {
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState(initialPageSize)
	const [search, setSearch] = useState("")
	const [segment, setSegmentState] = useState<UserSegment | null>(null)
	const [total, setTotal] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [summary, setSummary] = useState<UserSegments>(EMPTY_SUMMARY)

	const fetchUsers = useCallback(async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			params.set("page", String(page))
			params.set("pageSize", String(pageSize))
			if (search.trim()) {
				params.set("q", search.trim())
			}
			if (segment) {
				params.set("segment", segment)
			}
			const data = await apiFetch<AdminUsersPage>(`/api/admin/users?${params.toString()}`)
			setUsers(data.users)
			setTotal(data.total)
			setTotalPages(data.totalPages)
			setSummary(data.summary)
			setError(null)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Error al obtener usuarios"
			setError(message)
		} finally {
			setLoading(false)
		}
	}, [page, pageSize, search, segment])

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			void fetchUsers()
		}, 300)
		return () => clearTimeout(timeoutId)
	}, [fetchUsers])

	const handleSearchChange = (value: string) => {
		setSearch(value)
		setPage(1)
	}

	const handleSegmentChange = (value: UserSegment | null) => {
		setSegmentState(value)
		setPage(1)
	}

	const createUser = async (data: CreateUserData) => {
		const created = await apiFetch<User>("/api/users", {
			method: "POST",
			body: JSON.stringify(data),
		})
		await fetchUsers()
		return created
	}

	const updateUser = async (id: string, data: UpdateUserData) => {
		await apiFetch<void>(`/api/users/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		})
		await fetchUsers()
	}

	const deleteUser = async (id: string) => {
		await apiFetch<void>(`/api/users/${id}`, { method: "DELETE" })
		await fetchUsers()
	}

	const updateUserPlan = async (id: string, data: UpdateUserPlanData) => {
		await apiFetch<void>(`/api/users/${id}/plan`, {
			method: "PUT",
			body: JSON.stringify(data),
		})
		await fetchUsers()
	}

	const toggleUserPublic = async (isPublic: boolean) => {
		await apiFetch<void>("/api/users/public", {
			method: "PUT",
			body: JSON.stringify({ isPublic }),
		})
		await fetchUsers()
	}

	return {
		users,
		loading,
		error,
		page,
		pageSize,
		total,
		totalPages,
		summary,
		search,
		segment,
		setSearch: handleSearchChange,
		setSegment: handleSegmentChange,
		setPage,
		setPageSize,
		refetch: fetchUsers,
		createUser,
		updateUser,
		updateUserPlan,
		deleteUser,
		toggleUserPublic,
	}
}