import axios from "axios";
import { useState } from "react";
import api from "@/lib/api";

interface LoginData {
	email: string;
	password: string;
}

interface LoginResponse {
	token?: string;
	requiresTwoFactor?: boolean;
	twoFactorToken?: string;
	message?: string;
}

interface LoginResult {
	login: (data: LoginData) => Promise<void>;
	verifyTwoFactor: (code: string) => Promise<void>;
	resendTwoFactor: () => Promise<void>;
	resetTwoFactor: () => void;
	loading: boolean;
	error: string;
	info: string;
	success: boolean;
	twoFactorRequired: boolean;
}

export function useLogin(): LoginResult {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");
	const [success, setSuccess] = useState(false);
	const [twoFactorRequired, setTwoFactorRequired] = useState(false);
	const [twoFactorToken, setTwoFactorToken] = useState("");

	const login = async ({ email, password }: LoginData) => {
		setLoading(true);
		setError("");
		setInfo("");
		setSuccess(false);
		setTwoFactorRequired(false);
		setTwoFactorToken("");

		try {
			const res = await api.post<LoginResponse>(
				"/api/auth/login",
				{ email, password },
				{
					headers: {
						"X-App-Source": "main_web",
					},
				},
			);

			const { token, requiresTwoFactor, twoFactorToken: nextToken, message } =
				res.data;

			if (requiresTwoFactor && nextToken) {
				setTwoFactorRequired(true);
				setTwoFactorToken(nextToken);
				setInfo(message || "Se envió un código de verificación a tu correo.");
				return;
			}

			if (token) {
				localStorage.setItem("token", token);
			}

			setSuccess(true);
		} catch (err) {
			if (axios.isAxiosError(err) && err.response) {
				const status = err.response.status;
				const message = err.response.data?.message;

				switch (status) {
					case 400:
						setError("Faltan datos obligatorios.");
						break;
					case 401:
						setError("El usuario no existe.");
						break;
					case 402:
						setError("Contraseña Incorrecta.");
						break;
					case 423:
						setError(message || "Cuenta bloqueada temporalmente.");
						break;
					default:
						setError(message || "Error del servidor.");
				}
			} else {
				setError("No se pudo conectar con el servidor.");
			}
		} finally {
			setLoading(false);
		}
	};

	const verifyTwoFactor = async (code: string) => {
		if (!twoFactorToken) {
			setError("No hay verificación 2FA activa.");
			return;
		}

		setLoading(true);
		setError("");
		setInfo("");
		setSuccess(false);

		try {
			const res = await api.post<LoginResponse>(
				"/api/auth/verify-2fa",
				{ twoFactorToken, code },
				{
					headers: {
						"X-App-Source": "main_web",
					},
				},
			);
			const { token } = res.data;

			if (token) {
				localStorage.setItem("token", token);
				setTwoFactorRequired(false);
				setTwoFactorToken("");
				setSuccess(true);
				return;
			}

			setError("No se pudo completar la verificación.");
		} catch (err) {
			if (axios.isAxiosError(err) && err.response) {
				setError(err.response.data?.message || "Código inválido o expirado.");
			} else {
				setError("No se pudo conectar con el servidor.");
			}
		} finally {
			setLoading(false);
		}
	};

	const resendTwoFactor = async () => {
		if (!twoFactorToken) {
			setError("No hay verificación 2FA activa.");
			return;
		}

		setLoading(true);
		setError("");
		setInfo("");

		try {
			const res = await api.post<{ message?: string }>(
				"/api/auth/resend-2fa",
				{ twoFactorToken },
				{
					headers: {
						"X-App-Source": "main_web",
					},
				},
			);
			setInfo(res.data?.message || "Código reenviado.");
		} catch (err) {
			if (axios.isAxiosError(err) && err.response) {
				setError(err.response.data?.message || "No se pudo reenviar el código.");
			} else {
				setError("No se pudo conectar con el servidor.");
			}
		} finally {
			setLoading(false);
		}
	};

	const resetTwoFactor = () => {
		setTwoFactorRequired(false);
		setTwoFactorToken("");
		setInfo("");
		setError("");
	};

	return {
		login,
		verifyTwoFactor,
		resendTwoFactor,
		resetTwoFactor,
		loading,
		error,
		info,
		success,
		twoFactorRequired,
	};
}
