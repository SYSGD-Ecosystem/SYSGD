import { useState } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

interface LoginData {
	email: string;
	password: string;
}

interface LoginResult {
	login: (data: LoginData) => Promise<void>;
	loading: boolean;
	error: string;
	success: boolean;
}

export function useLogin(): LoginResult {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const login = async ({ email, password }: LoginData) => {
		setLoading(true);
		setError("");
		setSuccess(false);

		try {
			const res = await fetch(`${serverUrl}/api/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ email, password }),
			});

			if (res.status === 201) {
				setSuccess(true);
			} else if (res.status === 400) {
				setError("Faltan datos obligatorios.");
			} else if (res.status === 401) {
				setError("El usuario no existe.");
			} else if (res.status === 402) {
				setError("Contraseña Incorrecta");
			} else {
				setError("Error desconocido del servidor.");
			}
		} catch (err) {
			setError("No se pudo conectar con el servidor.");
		} finally {
			setLoading(false);
		}
	};

	return { login, loading, error, success };
}
