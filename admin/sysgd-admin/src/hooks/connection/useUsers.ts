import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type { CreateUserData, UpdateUserData, User } from "../../types/user"

type UseUsersReturn = {
	users: User[]
	loading: boolean
	error: string | null
	refetch: () => void
	createUser: (data: CreateUserData) => Promise<User>
	updateUser: (id: string, data: UpdateUserData) => Promise<void>
	deleteUser: (id: string) => Promise<void>
	toggleUserPublic: (isPublic: boolean) => Promise<void>
}

export function useUsers(): UseUsersReturn {
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchUsers = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<User[]>("/api/users")
			setUsers(data)
			setError(null)
		} catch (e: any) {
			setError(e?.message || "Error al obtener usuarios")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchUsers()
	}, [fetchUsers])

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
		setUsers((prev) => prev.filter((u) => u.id !== id))
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
		refetch: fetchUsers,
		createUser,
		updateUser,
		deleteUser,
		toggleUserPublic,
	}
}
