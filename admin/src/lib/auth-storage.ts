const TOKEN_KEY = "token"
const AUTH_KEY = "sysgd_auth"

export function getAuthToken(): string | null {
	return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function saveAuthToken(token: string, remember: boolean): void {
	clearAuthSession()
	const storage = remember ? localStorage : sessionStorage
	storage.setItem(TOKEN_KEY, token)
}

export function clearAuthSession(): void {
	localStorage.removeItem(TOKEN_KEY)
	localStorage.removeItem(AUTH_KEY)
	sessionStorage.removeItem(TOKEN_KEY)
	sessionStorage.removeItem(AUTH_KEY)
}
