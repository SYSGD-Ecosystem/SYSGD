import { clearAuthSession, getAuthToken } from "./auth-storage"

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

type ApiFetchInit = RequestInit & {
	token?: string
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
	const baseUrl = getBaseUrl()
	const { token: explicitToken, ...requestInit } = init
	const token = explicitToken ?? getAuthToken()

	const headers = new Headers(requestInit.headers)
	if (!headers.has("Content-Type") && requestInit.body) {
		headers.set("Content-Type", "application/json")
	}
	if (token) {
		headers.set("Authorization", `Bearer ${token}`)
	}

	const res = await fetch(`${baseUrl}${path}`, {
		...requestInit,
		headers,
		credentials: "include",
	})

	if (res.status === 401) {
		clearAuthSession()
	}

	if (!res.ok) {
		let payload: { message?: string; [key: string]: unknown } | undefined
		try {
			payload = (await res.json()) as { message?: string; [key: string]: unknown }
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
