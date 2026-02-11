// import { useState } from "react";

// const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

// interface RegisterData {
// 	name: string;
// 	email: string;
// 	password: string;
// }

// interface RegisterResult {
// 	register: (data: RegisterData) => Promise<void>;
// 	loading: boolean;
// 	error: string;
// 	success: boolean;
// }

// export function useRegisterUser(): RegisterResult {
// 	const [loading, setLoading] = useState(false);
// 	const [error, setError] = useState("");
// 	const [success, setSuccess] = useState(false);

// 	const register = async ({ name, email, password }: RegisterData) => {
// 		setLoading(true);
// 		setError("");
// 		setSuccess(false);

// 		try {
// 			const res = await fetch(`${serverUrl}/api/register`, {
// 				method: "POST",
// 				headers: {
// 					"Content-Type": "application/json",
// 				},
// 				body: JSON.stringify({ name, email, password }),
// 			});

// 			if (res.status === 201) {
// 				setSuccess(true);
// 			} else if (res.status === 400) {
// 				setError("Faltan datos obligatorios.");
// 			} else if (res.status === 409) {
// 				setError("El usuario ya existe.");
// 			} else {
// 				setError("Error desconocido del servidor.");
// 			}
// 		} catch (err) {
// 			setError("No se pudo conectar con el servidor.");
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	return { register, loading, error, success };
// }

import { useState } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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
			const res = await fetch(`${serverUrl}/api/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name, email, password }),
			});

			const responseText = await res.text();
			let data: Record<string, unknown> = {};

			if (responseText) {
				try {
					data = JSON.parse(responseText) as Record<string, unknown>;
				} catch {
					data = { message: responseText };
				}
			}

			if (res.status === 201) {
				setSuccess(true);
				
				// Guardar el token si viene en la respuesta
				if (typeof data.token === "string") {
					localStorage.setItem("token", data.token);
				}
			} else if (res.status === 400) {
				setError("Faltan datos obligatorios.");
			} else if (res.status === 409) {
				setError("El usuario ya existe.");
			} else {
				setError(
					typeof data.error === "string"
						? data.error
						: typeof data.message === "string"
							? data.message
							: "Error desconocido del servidor.",
				);
			}
		} catch (err) {
			setError("No se pudo conectar con el servidor.");
		} finally {
			setLoading(false);
		}
	};

	return { register, loading, error, success };
}
