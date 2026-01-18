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

export async function apiFetchPublic<T>(path: string, init: RequestInit = {}): Promise<T> {
	const baseUrl = getBaseUrl()
	const headers = new Headers(init.headers)
	if (!headers.has("Content-Type") && init.body) {
		headers.set("Content-Type", "application/json")
	}

	const res = await fetch(`${baseUrl}${path}`, {
		...init,
		headers,
		credentials: "include",
	})

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

	if (res.status === 204) return undefined as T

	const contentType = res.headers.get("content-type") || ""
	if (contentType.includes("application/json")) {
		return (await res.json()) as T
	}
	return (await res.text()) as unknown as T
}
