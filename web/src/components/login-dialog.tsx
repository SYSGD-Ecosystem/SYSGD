import { useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, LogIn, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface LoginDialogProps {
	open: boolean
	onClose: () => void
}

export function LoginDialog({ open, onClose }: LoginDialogProps) {
	const { login } = useAuth()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (!open) return null

	async function handleSubmit(e: FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError(null)
		const result = await login(email.trim(), password)
		setLoading(false)

		if (result.ok) {
			setEmail("")
			setPassword("")
			onClose()
		} else {
			setError(result.error || "Credenciales inválidas")
		}
	}

	return createPortal(
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
			onClick={onClose}
			role="presentation"
		>
			<div
				className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label="Iniciar sesión"
			>
				<div className="flex items-start justify-between mb-1">
					<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
						Iniciar sesión
					</h2>
					<Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
						<X className="w-4 h-4" />
					</Button>
				</div>
				<p className="text-sm text-muted-foreground mb-5">
					Usa tu cuenta de SYSGD para votar y gestionar tus publicaciones.
				</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<div>
						<label htmlFor="login-email" className="text-sm font-medium mb-1.5 block">
							Correo electrónico
						</label>
						<Input
							id="login-email"
							type="email"
							required
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="tu@correo.com"
						/>
					</div>
					<div>
						<label htmlFor="login-password" className="text-sm font-medium mb-1.5 block">
							Contraseña
						</label>
						<Input
							id="login-password"
							type="password"
							required
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
						/>
					</div>

					{error && (
						<p className="text-sm text-red-600 dark:text-red-400" role="alert">
							{error}
						</p>
					)}

					<Button type="submit" disabled={loading} className="mt-1 w-full">
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<LogIn className="w-4 h-4" />
						)}
						Entrar
					</Button>
				</form>
			</div>
		</div>,
		document.body,
	)
}
