import { useCallback, useEffect, useState } from "react";
import type { CreateUserData, UpdateUserData, User } from "../../types/user";
import api from "@/lib/api"; // Instancia centralizada de Axios

interface UseUsersReturn {
	users: User[];
	loading: boolean;
	error: string | null;
	refetch: () => void;
	createUser: (data: CreateUserData) => Promise<User | void>;
	updateUser: (id: string, data: UpdateUserData) => Promise<void>;
	deleteUser: (id: string) => Promise<void>;
	toggleUserPublic: (isPublic: boolean) => Promise<void>;
}

export function useUsers(): UseUsersReturn {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// GET: Obtener lista de usuarios
	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get<User[]>("/api/users");
			setUsers(res.data);
			setError(null);
		} catch (err: any) {
			setError(err.response?.data?.message || "Error al obtener usuarios");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	// POST: Crear usuario
	const createUser = async (data: CreateUserData) => {
		try {
			const res = await api.post<User>("/api/users", data);
			await fetchUsers(); // Refrescamos la lista para ver el nuevo usuario
			return res.data;
		} catch (err: any) {
			const msg = err.response?.data?.message || "Error al crear usuario";
			throw new Error(msg);
		}
	};

	// PUT: Actualizar usuario
	const updateUser = async (id: string, data: UpdateUserData) => {
		try {
			await api.put(`/api/users/${id}`, data);
			await fetchUsers();
		} catch (err: any) {
			const msg = err.response?.data?.message || "Error al actualizar usuario";
			throw new Error(msg);
		}
	};

	// DELETE: Eliminar usuario
	const deleteUser = async (id: string) => {
		try {
			await api.delete(`/api/users/${id}`);
			// Optimización local: filtramos el usuario borrado sin esperar al refetch
			setUsers((prev) => prev.filter((u) => u.id !== id));
		} catch (err: any) {
			const msg = err.response?.data?.message || "Error al eliminar usuario";
			throw new Error(msg);
		}
	};

	// PUT: Modificar estado público/privado
	const toggleUserPublic = async (isPublic: boolean) => {
		try {
			await api.put("/api/users/public", { isPublic });
			await fetchUsers();
		} catch (err: any) {
			const msg = err.response?.data?.message || "Error al modificar estado";
			throw new Error(msg);
		}
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
