import type React from "react"

import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { apiFetch } from "../../lib/api"
import { clearAuthSession, getAuthToken } from "../../lib/auth-storage"

export default function ProtectedRoute({
	children,
}: {
	children: React.ReactNode
}) {
	const location = useLocation()
	const isAuth = Boolean(getAuthToken())
	const [checked, setChecked] = useState(false)
	const [isAdminUser, setIsAdminUser] = useState(false)

	useEffect(() => {
		if (!isAuth) {
			setChecked(true)
			return
		}

		let cancelled = false

		async function run() {
			try {
				const me = await apiFetch<{ privileges?: string }>("/api/auth/me")
				if (cancelled) return
				setIsAdminUser(me?.privileges === "admin")
			} catch {
				clearAuthSession()
				if (!cancelled) setIsAdminUser(false)
			} finally {
				if (!cancelled) setChecked(true)
			}
		}

		run()
		return () => {
			cancelled = true
		}
	}, [isAuth])

	if (!isAuth) {
		return <Navigate to="/" state={{ from: location }} replace />
	}

	if (!checked) {
		return null
	}

	if (!isAdminUser) {
		clearAuthSession()
		return <Navigate to="/" state={{ from: location }} replace />
	}

	return <>{children}</>
}
