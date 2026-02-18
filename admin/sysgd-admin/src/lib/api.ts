type ApiErrorDetails = {
	status: number
	message: string
	details?: unknown
}

export class ApiError extends Error {
	status: number
	details?: unknown

	constructor({ status, message, details }: ApiErrorDetails) {
		super(message)
		this.status = status
		this.details = details
	}
}

function getBaseUrl() {
	return import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
}

function getAuthToken() {
	return localStorage.getItem("token")
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
	const baseUrl = getBaseUrl()
	const token = getAuthToken()

	const headers = new Headers(init.headers)
	if (!headers.has("Content-Type") && init.body) {
		headers.set("Content-Type", "application/json")
	}
	if (token) {
		headers.set("Authorization", `Bearer ${token}`)
	}

	const res = await fetch(`${baseUrl}${path}`, {
		...init,
		headers,
		credentials: "include",
	})

	if (res.status === 401) {
		localStorage.removeItem("token")
		localStorage.removeItem("sysgd_auth")
	}

	if (!res.ok) {
		let payload: any = undefined
		try {
			payload = await res.json()
		} catch {
			payload = undefined
		}
		throw new ApiError({
			status: res.status,
			message: payload?.message || res.statusText || "Request failed",
			details: payload,
		})
	}

	if (res.status === 204) {
		return undefined as T
	}

	const contentType = res.headers.get("content-type") || ""
	if (contentType.includes("application/json")) {
		return (await res.json()) as T
	}

	return (await res.text()) as unknown as T
}
