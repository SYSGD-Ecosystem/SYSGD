/* eslint-disable react-refresh/only-export-components -- contexto + hook en un solo archivo */
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react"
import { apiFetchPublic } from "../lib/api"

export interface AuthUser {
	id: string
	email: string
	name?: string
	privileges?: string
}

interface LoginResult {
	ok: boolean
	error?: string
}

interface AuthContextValue {
	user: AuthUser | null
	token: string | null
	login: (email: string, password: string) => Promise<LoginResult>
	logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = "sysgd_token"
const USER_KEY = "sysgd_user"

function readStoredUser(): AuthUser | null {
	try {
		const raw = localStorage.getItem(USER_KEY)
		const token = localStorage.getItem(TOKEN_KEY)
		if (!raw || !token) return null
		return JSON.parse(raw) as AuthUser
	} catch {
		return null
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(readStoredUser)
	const [token, setToken] = useState<string | null>(() =>
		localStorage.getItem(TOKEN_KEY),
	)

	const login = useCallback(
		async (email: string, password: string): Promise<LoginResult> => {
			try {
				const data = await apiFetchPublic<{ token?: string; user?: AuthUser; message?: string }>(
					"/api/auth/login",
					{
						method: "POST",
						body: JSON.stringify({ email, password }),
					},
				)

				if (!data?.token || !data?.user) {
					return { ok: false, error: data?.message || "Credenciales inválidas" }
				}

				localStorage.setItem(TOKEN_KEY, data.token)
				localStorage.setItem(USER_KEY, JSON.stringify(data.user))
				setToken(data.token)
				setUser(data.user)
				return { ok: true }
			} catch (e: unknown) {
				const message =
					e instanceof Error ? e.message : "No se pudo iniciar sesión"
				return { ok: false, error: message }
			}
		},
		[],
	)

	const logout = useCallback(() => {
		localStorage.removeItem(TOKEN_KEY)
		localStorage.removeItem(USER_KEY)
		setToken(null)
		setUser(null)
	}, [])

	const value = useMemo(
		() => ({ user, token, login, logout }),
		[user, token, login, logout],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext)
	if (!ctx) {
		throw new Error("useAuth debe usarse dentro de <AuthProvider>")
	}
	return ctx
}
