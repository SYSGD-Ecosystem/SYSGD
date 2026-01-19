import type React from "react"

import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { apiFetch } from "../../lib/api"

export default function ProtectedRoute({
	children,
}: {
	children: React.ReactNode
}) {
	const location = useLocation()
	const token = localStorage.getItem("token")
	const isAuth = Boolean(token)
	const [checked, setChecked] = useState(false)
	const [isAdminUser, setIsAdminUser] = useState(false)

	if (!isAuth) {
		return <Navigate to="/" state={{ from: location }} replace />
	}

	useEffect(() => {
		let cancelled = false

		async function run() {
			try {
				const me = await apiFetch<{ privileges?: string }>("/api/auth/me")
				if (cancelled) return
				setIsAdminUser(me?.privileges === "admin")
			} catch {
				localStorage.removeItem("token")
				localStorage.removeItem("sysgd_auth")
				if (!cancelled) setIsAdminUser(false)
			} finally {
				if (!cancelled) setChecked(true)
			}
		}

		run()
		return () => {
			cancelled = true
		}
	}, [])

	if (!checked) {
		return null
	}

	if (!isAdminUser) {
		localStorage.removeItem("token")
		localStorage.removeItem("sysgd_auth")
		return <Navigate to="/" state={{ from: location }} replace />
	}

	return <>{children}</>
}
