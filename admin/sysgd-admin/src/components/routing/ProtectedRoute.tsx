import type React from "react"

import { Navigate, useLocation } from "react-router-dom"

export default function ProtectedRoute({
	children,
}: {
	children: React.ReactNode
}) {
	const location = useLocation()
	const token = localStorage.getItem("token")
	const isAuth = Boolean(token)

	if (!isAuth) {
		return <Navigate to="/" state={{ from: location }} replace />
	}

	return <>{children}</>
}
