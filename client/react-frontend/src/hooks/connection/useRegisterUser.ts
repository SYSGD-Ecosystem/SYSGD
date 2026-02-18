import axios from "axios";
import { useState } from "react";
import api from "@/lib/api";

interface RegisterData {
	name: string;
	email: string;
	password: string;
}

interface RegisterResult {
	register: (data: RegisterData) => Promise<void>;
	loading: boolean;
	error: string;
	success: boolean;
}

export function useRegisterUser(): RegisterResult {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const register = async ({ name, email, password }: RegisterData) => {
		setLoading(true);
		setError("");
		setSuccess(false);

		try {
			await api.post("/api/register", { name, email, password });
			setSuccess(true);

			try {
				const loginResponse = await api.post("/api/auth/login", {
					email,
					password,
				});
				const token = loginResponse.data?.token;
				if (typeof token === "string" && token.length > 0) {
					localStorage.setItem("token", token);
				}
			} catch (loginErr) {
				console.warn(
					"Registro exitoso, pero no se pudo iniciar sesión automáticamente.",
					loginErr,
				);
			}
		} catch (err) {
			if (axios.isAxiosError(err) && err.response) {
				const status = err.response.status;
				const message = err.response.data?.error || err.response.data?.message;

				if (status === 400) {
					setError("Faltan datos obligatorios.");
				} else if (status === 409) {
					setError("El usuario ya existe.");
				} else {
					setError(
						typeof message === "string"
							? message
							: "Error desconocido del servidor.",
					);
				}
			} else {
				setError("No se pudo conectar con el servidor.");
			}
		} finally {
			setLoading(false);
		}
	};

	return { register, loading, error, success };
}
