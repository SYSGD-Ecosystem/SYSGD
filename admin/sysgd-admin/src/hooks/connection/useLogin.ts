import { useState } from "react"

import { apiFetch } from "../../lib/api"

type LoginData = {
	email: string
	password: string
}

type LoginResult = {
	login: (data: LoginData) => Promise<void>
	loading: boolean
	error: string
	success: boolean
}

export function useLogin(): LoginResult {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [success, setSuccess] = useState(false)

	const login = async ({ email, password }: LoginData) => {
		setLoading(true)
		setError("")
		setSuccess(false)

		try {
			const res = await apiFetch<{ token?: string }>("/api/auth/login", {
				method: "POST",
				body: JSON.stringify({ email, password }),
			})

			if (res?.token) {
				localStorage.setItem("token", res.token)
			}
			setSuccess(true)
		} catch (e: any) {
			const status = e?.status
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
				default:
					setError(e?.message || "Error del servidor.")
			}
		} finally {
			setLoading(false)
		}
	}

	return { login, loading, error, success }
}
