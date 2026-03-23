import { useState } from "react"

import { apiFetch } from "../../lib/api"
import { ApiError } from "../../lib/api"

type LoginData = {
	email: string
	password: string
}

type LoginResponse = {
	token?: string
	requiresTwoFactor?: boolean
	twoFactorToken?: string
	message?: string
}

type VerifyTwoFactorData = {
	code: string
}

type LoginResult = {
	login: (data: LoginData) => Promise<void>
	verifyTwoFactor: (data: VerifyTwoFactorData) => Promise<void>
	resendTwoFactor: () => Promise<void>
	resetTwoFactor: () => void
	loading: boolean
	error: string
	info: string
	success: boolean
	twoFactorRequired: boolean
}

export function useLogin(): LoginResult {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [info, setInfo] = useState("")
	const [success, setSuccess] = useState(false)
	const [twoFactorRequired, setTwoFactorRequired] = useState(false)
	const [twoFactorToken, setTwoFactorToken] = useState("")

	const resetTwoFactor = () => {
		setTwoFactorRequired(false)
		setTwoFactorToken("")
		setInfo("")
		setError("")
	}

	const login = async ({ email, password }: LoginData) => {
		setLoading(true)
		setError("")
		setInfo("")
		setSuccess(false)
		setTwoFactorRequired(false)
		setTwoFactorToken("")

		try {
			const res = await apiFetch<LoginResponse>("/api/auth/login", {
				method: "POST",
				headers: {
					"X-App-Source": "admin_panel",
				},
				body: JSON.stringify({ email, password }),
			})

			if (res?.requiresTwoFactor && res?.twoFactorToken) {
				setTwoFactorRequired(true)
				setTwoFactorToken(res.twoFactorToken)
				setInfo(res.message || "Se envió un código de verificación al correo.")
				return
			}

			if (res?.token) {
				localStorage.setItem("token", res.token)
				setSuccess(true)
				return
			}

			setError("No se pudo iniciar sesión.")
		} catch (e: unknown) {
			const status = e instanceof ApiError ? e.status : undefined
			switch (status) {
				case 400:
					setError("Faltan datos obligatorios.")
					break
				case 401:
					setError("El usuario no existe.")
					break
				case 402:
					setError("Contraseña Incorrecta.")
					break
				case 403:
					setError("Acceso denegado para esta cuenta.")
					break
				case 429:
					setError("Demasiados intentos. Espera un momento e inténtalo de nuevo.")
					break
				default:
					setError(e instanceof Error ? e.message : "Error del servidor.")
			}
		} finally {
			setLoading(false)
		}
	}

	const verifyTwoFactor = async ({ code }: VerifyTwoFactorData) => {
		if (!twoFactorToken) {
			setError("No hay un desafío 2FA activo.")
			return
		}

		setLoading(true)
		setError("")
		setInfo("")
		setSuccess(false)

		try {
			const res = await apiFetch<LoginResponse>("/api/auth/verify-2fa", {
				method: "POST",
				headers: {
					"X-App-Source": "admin_panel",
				},
				body: JSON.stringify({ twoFactorToken, code }),
			})

			if (res?.token) {
				localStorage.setItem("token", res.token)
				setSuccess(true)
				setTwoFactorRequired(false)
				setTwoFactorToken("")
				return
			}

			setError("No se pudo validar el segundo factor.")
		} catch (e: unknown) {
			const status = e instanceof ApiError ? e.status : undefined
			if (status === 401) {
				setError("Código inválido o expirado.")
			} else if (status === 429) {
				setError("Demasiados intentos. Espera un momento.")
			} else {
				setError(e instanceof Error ? e.message : "Error validando el código.")
			}
		} finally {
			setLoading(false)
		}
	}

	const resendTwoFactor = async () => {
		if (!twoFactorToken) {
			setError("No hay un desafío 2FA activo.")
			return
		}

		setLoading(true)
		setError("")
		setInfo("")

		try {
			const res = await apiFetch<{ message?: string }>("/api/auth/resend-2fa", {
				method: "POST",
				headers: {
					"X-App-Source": "admin_panel",
				},
				body: JSON.stringify({ twoFactorToken }),
			})
			setInfo(res?.message || "Código reenviado correctamente.")
		} catch (e: unknown) {
			const status = e instanceof ApiError ? e.status : undefined
			if (status === 429) {
				setError("Debes esperar antes de solicitar un nuevo código.")
			} else {
				setError(e instanceof Error ? e.message : "No se pudo reenviar el código.")
			}
		} finally {
			setLoading(false)
		}
	}

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
	}
}
