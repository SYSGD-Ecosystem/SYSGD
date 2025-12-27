import { useCallback, useEffect, useState } from "react";
import type { CreateUserData, UpdateUserData, User } from "../../types/user";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

interface UseUsersReturn {
	users: User[];
	loading: boolean;
	error: string | null;
	refetch: () => void;
	createUser: (data: CreateUserData) => Promise<User>;
	updateUser: (id: string, data: UpdateUserData) => Promise<void>;
	deleteUser: (id: string) => Promise<void>;
	toggleUserPublic: (isPublic: boolean) => Promise<void>;
}

export function useUsers(): UseUsersReturn {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchUsers = useCallback(() => {
		setLoading(true);
		fetch(`${serverUrl}/api/users`, {
			credentials: "include",
		})
			.then(async (res) => {
				if (!res.ok) throw new Error("Error al obtener usuarios");
				const data = await res.json();
				setUsers(data);
			})
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const createUser = async (data: CreateUserData): Promise<User> => {
		const res = await fetch(`${serverUrl}/api/users`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			const msg = await res.text();
			throw new Error(msg || "Error al crear usuario");
		}
		// backend returns 201 with no body, refetch list
		fetchUsers();
		// Try to get created user by another call; simpler return placeholder
		return { id: `${Date.now()}`, ...data };
	};

	const updateUser = async (id: string, data: UpdateUserData) => {
		const res = await fetch(`${serverUrl}/api/users/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			const msg = await res.text();
			throw new Error(msg || "Error al actualizar usuario");
		}
		fetchUsers();
	};

	const deleteUser = async (id: string) => {
		const res = await fetch(`${serverUrl}/api/users/${id}`, {
			method: "DELETE",
			credentials: "include",
		});
		if (!res.ok) {
			const msg = await res.text();
			throw new Error(msg || "Error al eliminar usuario");
		}
		fetchUsers();
	};

	// modificar estado publico o privado del usuario
	const toggleUserPublic = async (isPublic: boolean) => {
		const res = await fetch(`${serverUrl}/api/users/public`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ isPublic }),
		});
		if (!res.ok) {
			const msg = await res.text();
			throw new Error(msg || "Error al modificar estado de usuario");
		}
		fetchUsers();
	};

	return {
		users,
		loading,
		error,
		refetch: fetchUsers,
		createUser,
		updateUser,
		deleteUser,
		toggleUserPublic,
	};
}
