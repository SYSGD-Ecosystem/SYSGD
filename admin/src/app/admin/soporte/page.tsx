import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
	Check,
	ChevronLeft,
	ChevronRight,
	Cpu,
	Eye,
	Loader2,
	Lock,
	LockOpen,
	Mail,
	MailWarning,
	Search,
	Send,
	Sparkles,
	X,
} from "lucide-react"

import { useSupportTickets } from "../../../hooks/connection/useSupportTickets"
import { apiFetch } from "../../../lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../../components/ui/table"
import type { AdminUsersPage } from "../../../types/user"
import type { SupportEmailStatus, SupportTicket, SupportTicketStatus } from "../../../types/support"

const statusLabels: Record<SupportTicketStatus, string> = {
	open: "Abierto",
	closed: "Cerrado",
}

const statusVariants: Record<SupportTicketStatus, "default" | "secondary" | "destructive" | "outline"> = {
	open: "default",
	closed: "outline",
}

const emailStatusLabels: Record<SupportEmailStatus, string> = {
	pending: "Pendiente",
	sent: "Enviado",
	failed: "Fallido",
}

const emailStatusVariants: Record<SupportEmailStatus, "default" | "secondary" | "destructive" | "outline"> = {
	pending: "secondary",
	sent: "default",
	failed: "destructive",
}

const formatDate = (value: string) => {
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? "Sin fecha" : parsed.toLocaleString("es-CU")
}

const EMPTY_FORM = { email: "", name: "", subject: "", message: "" }

const aiModels = [
	{
		id: "gemini-2.5-flash",
		name: "Gemini 2.5 Flash",
		provider: "Google",
		provider_id: "gemini",
	},
	{
		id: "gemini-2.5-flash-lite",
		name: "Gemini 2.5 Flash Lite",
		provider: "Google",
		provider_id: "gemini",
	},
	{
		id: "openai/gpt-oss-120b:free",
		name: "GPT‑120B",
		provider: "OpenRouter",
		provider_id: "openrouter",
	},
]

export default function SupportPage() {
	const {
		tickets,
		loading,
		error,
		page,
		pageSize,
		total,
		totalPages,
		summary,
		search,
		statusFilter,
		setSearch,
		setStatusFilter,
		setPage,
		setPageSize,
		createTicket,
		updateTicketStatus,
	} = useSupportTickets()

	const [formData, setFormData] = useState(EMPTY_FORM)
	const [emailSuggestions, setEmailSuggestions] = useState<AdminUsersPage["users"]>([])
	const [submitting, setSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const [viewTicket, setViewTicket] = useState<SupportTicket | null>(null)
	const [statusUpdating, setStatusUpdating] = useState<string | null>(null)

	const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash")
	const [aiLoading, setAiLoading] = useState(false)
	const [aiError, setAiError] = useState<string | null>(null)
	const [improvedText, setImprovedText] = useState("")
	const [showImprovedPreview, setShowImprovedPreview] = useState(false)

	const selectedModelObj = useMemo(
		() => aiModels.find((model) => model.id === selectedModel),
		[selectedModel],
	)

	useEffect(() => {
		const value = formData.email.trim()
		if (value.length < 3) {
			setEmailSuggestions([])
			return
		}
		const timeoutId = setTimeout(() => {
			void (async () => {
				try {
					const params = new URLSearchParams({ page: "1", pageSize: "8", q: value })
					const data = await apiFetch<AdminUsersPage>(`/api/admin/users?${params.toString()}`)
					setEmailSuggestions(data.users)
				} catch {
					setEmailSuggestions([])
				}
			})()
		}, 300)
		return () => clearTimeout(timeoutId)
	}, [formData.email])

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault()
		setFormError(null)
		setSuccessMessage(null)

		const email = formData.email.trim()
		const subject = formData.subject.trim()
		const message = formData.message.trim()

		if (!email) {
			setFormError("El correo del destinatario es requerido")
			return
		}
		if (subject.length < 3) {
			setFormError("El asunto debe tener al menos 3 caracteres")
			return
		}
		if (message.length < 10) {
			setFormError("El mensaje debe tener al menos 10 caracteres")
			return
		}

		setSubmitting(true)
		try {
			const ticket = await createTicket({
				email,
				name: formData.name.trim(),
				subject,
				message,
			})
			setSuccessMessage(
				ticket.email_status === "sent"
					? `Ticket abierto. Correo enviado a ${ticket.recipient_email}.`
					: `Ticket abierto, pero el correo a ${ticket.recipient_email} no pudo enviarse. Revisa la configuración de envío.`,
			)
			setFormData(EMPTY_FORM)
			setEmailSuggestions([])
			setImprovedText("")
			setShowImprovedPreview(false)
			setAiError(null)
		} catch (e: unknown) {
			setFormError(e instanceof Error ? e.message : "Error al abrir el ticket")
		} finally {
			setSubmitting(false)
		}
	}

	const handleImprove = async () => {
		if (formData.message.trim().length < 10) return

		setAiLoading(true)
		setAiError(null)
		setImprovedText("")
		setShowImprovedPreview(false)

		try {
			const response = await apiFetch<{ respuesta?: string }>("/api/admin/support/generate", {
				method: "POST",
				body: JSON.stringify({
					message: formData.message,
					subject: formData.subject,
					model: selectedModel,
					provider: selectedModelObj?.provider_id || "gemini",
				}),
			})
			const text = response?.respuesta || "No se recibió texto."
			setImprovedText(text)
			setShowImprovedPreview(true)
		} catch (e: unknown) {
			setAiError(e instanceof Error ? e.message : "Error al mejorar el mensaje con IA")
		} finally {
			setAiLoading(false)
		}
	}

	const handleToggleStatus = async (ticket: SupportTicket) => {
		setStatusUpdating(ticket.id)
		try {
			await updateTicketStatus(ticket.id, ticket.status === "open" ? "closed" : "open")
		} finally {
			setStatusUpdating(null)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Soporte</h1>
					<p className="text-muted-foreground">
						Abre tickets de ayuda y envía correos a los usuarios desde el dominio de la plataforma.
					</p>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Tickets totales</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.total}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Abiertos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.open}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Cerrados</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.closed}</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-5">
				<Card className="border-border lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Mail className="h-4 w-4" />
							Abrir ticket de ayuda
						</CardTitle>
						<CardDescription>
							El usuario recibirá el correo con el remitente de SYSGD. Si el correo existe en la
							plataforma, el ticket quedará vinculado a su cuenta.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="support-email">Correo del destinatario</Label>
								<Input
									id="support-email"
									type="email"
									list="support-user-emails"
									value={formData.email}
									onChange={(event) =>
										setFormData({ ...formData, email: event.target.value })
									}
									placeholder="usuario@ejemplo.com"
									autoComplete="off"
								/>
								<datalist id="support-user-emails">
									{emailSuggestions.map((user) => (
										<option key={user.id} value={user.email}>
											{user.name || user.email}
										</option>
									))}
								</datalist>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="support-name">Nombre (opcional)</Label>
								<Input
									id="support-name"
									value={formData.name}
									onChange={(event) => setFormData({ ...formData, name: event.target.value })}
									placeholder="Se completa solo si el usuario está registrado"
								/>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="support-subject">Asunto</Label>
								<Input
									id="support-subject"
									value={formData.subject}
									onChange={(event) => setFormData({ ...formData, subject: event.target.value })}
									placeholder="Ayuda con la descarga de tu compra"
								/>
							</div>

							<div className="flex flex-col gap-2">
								<div className="flex items-center justify-between gap-2">
									<Label htmlFor="support-message">Mensaje</Label>
									<div className="flex items-center gap-2">
										<Select value={selectedModel} onValueChange={setSelectedModel}>
											<SelectTrigger className="h-8 w-44 text-xs">
												<Cpu className="h-3 w-3" />
												<span className="font-medium">
													{selectedModelObj?.name ?? "Seleccionar modelo"}
												</span>
												{selectedModelObj && (
													<span className="ml-1 text-[10px] text-muted-foreground">
														({selectedModelObj.provider})
													</span>
												)}
											</SelectTrigger>
											<SelectContent className="text-xs z-[100]" sideOffset={4} withPortal={false}>
												{aiModels.map((model) => (
													<SelectItem key={model.id} value={model.id} className="text-xs">
														<div className="flex flex-col">
															<span className="font-medium">{model.name}</span>
															<span className="text-[10px] text-muted-foreground">
																{model.provider}
															</span>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button
											type="button"
											size="sm"
											variant="secondary"
											disabled={aiLoading || formData.message.trim().length < 10}
											onClick={() => void handleImprove()}
											className="h-8 px-3 gap-1"
										>
											{aiLoading ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Sparkles className="h-4 w-4" />
											)}
											{!aiLoading && "Mejorar"}
										</Button>
									</div>
								</div>
								<Textarea
									id="support-message"
									value={formData.message}
									onChange={(event) => setFormData({ ...formData, message: event.target.value })}
									placeholder="Escribe el mensaje que recibirá el usuario... (mínimo 10 caracteres)"
									rows={7}
								/>
								{aiError && <p className="text-sm text-destructive">{aiError}</p>}

								{showImprovedPreview && improvedText && (
									<div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/50 space-y-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
												<Sparkles className="h-4 w-4" />
												Mensaje mejorado con IA
											</div>
											<Button
												type="button"
												size="sm"
												variant="ghost"
												onClick={() => setShowImprovedPreview(false)}
											>
												<X className="h-4 w-4" />
											</Button>
										</div>

										<div className="bg-white dark:bg-slate-800 rounded-md p-3 max-h-48 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
											{improvedText}
										</div>

										<div className="flex gap-2">
											<Button
												type="button"
												size="sm"
												onClick={() => {
													setFormData({ ...formData, message: improvedText })
													setShowImprovedPreview(false)
												}}
												className="flex-1"
											>
												<Check className="h-4 w-4 mr-1" />
												Aceptar y aplicar
											</Button>
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={() => setShowImprovedPreview(false)}
												className="flex-1"
											>
												<X className="h-4 w-4 mr-1" />
												Descartar
											</Button>
										</div>
									</div>
								)}
							</div>

							{formError && <p className="text-sm text-destructive">{formError}</p>}
							{successMessage && (
								<p className="text-sm text-green-600 dark:text-green-500">{successMessage}</p>
							)}

							<Button type="submit" disabled={submitting} className="gap-2">
								<Send className="h-4 w-4" />
								{submitting ? "Enviando..." : "Abrir ticket y enviar correo"}
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card className="border-border lg:col-span-3">
					<CardHeader>
						<div className="flex items-center justify-between gap-4">
							<div>
								<CardTitle>Historial de tickets</CardTitle>
								<CardDescription>Consulta el estado de los tickets abiertos.</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<div className="relative w-56">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={search}
										onChange={(event) => setSearch(event.target.value)}
										placeholder="Buscar por correo o asunto"
										className="pl-10"
									/>
								</div>
								<Select
									value={statusFilter}
									onValueChange={(value) => setStatusFilter(value as SupportTicketStatus | "all")}
								>
									<SelectTrigger className="w-32">
										<SelectValue placeholder="Estado" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos</SelectItem>
										<SelectItem value="open">Abiertos</SelectItem>
										<SelectItem value="closed">Cerrados</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{error && <p className="pb-3 text-sm text-destructive">{error}</p>}
						<div className="overflow-x-auto rounded-md border border-border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Fecha</TableHead>
										<TableHead>Destinatario</TableHead>
										<TableHead>Asunto</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead>Correo</TableHead>
										<TableHead className="text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tickets.map((ticket) => (
										<TableRow key={ticket.id}>
											<TableCell className="whitespace-nowrap">
												{formatDate(ticket.created_at)}
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-medium">
														{ticket.recipient_name || "Sin nombre"}
													</span>
													<span className="text-xs text-muted-foreground">
														{ticket.recipient_email}
													</span>
												</div>
											</TableCell>
											<TableCell className="max-w-56 truncate">{ticket.subject}</TableCell>
											<TableCell>
												<Badge variant={statusVariants[ticket.status]}>
													{statusLabels[ticket.status]}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge variant={emailStatusVariants[ticket.email_status]} className="gap-1">
													{ticket.email_status === "failed" ? (
														<MailWarning className="h-3 w-3" />
													) : null}
													{emailStatusLabels[ticket.email_status]}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														className="gap-1"
														onClick={() => setViewTicket(ticket)}
													>
														<Eye className="h-3 w-3" />
														Ver
													</Button>
													<Button
														variant="outline"
														size="sm"
														className="gap-1"
														disabled={statusUpdating === ticket.id}
														onClick={() => void handleToggleStatus(ticket)}
													>
														{ticket.status === "open" ? (
															<>
																<Lock className="h-3 w-3" />
																Cerrar
															</>
														) : (
															<>
																<LockOpen className="h-3 w-3" />
																Reabrir
															</>
														)}
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{tickets.length === 0 && !loading && (
							<div className="py-8 text-center">
								<p className="text-muted-foreground">No se encontraron tickets de soporte</p>
							</div>
						)}

						{loading && (
							<p className="py-4 text-center text-sm text-muted-foreground">
								Cargando tickets...
							</p>
						)}

						<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-xs text-muted-foreground">
								Mostrando {tickets.length} de {total} tickets · Página {page} de {totalPages}
							</p>
							<div className="flex items-center gap-2">
								<Select
									value={String(pageSize)}
									onValueChange={(value) => {
										setPageSize(Number(value))
										setPage(1)
									}}
								>
									<SelectTrigger className="w-32">
										<SelectValue placeholder="Por página" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="10">10 / página</SelectItem>
										<SelectItem value="20">20 / página</SelectItem>
										<SelectItem value="50">50 / página</SelectItem>
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									size="sm"
									className="gap-1"
									onClick={() => setPage(Math.max(page - 1, 1))}
									disabled={page <= 1 || loading}
								>
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="gap-1"
									onClick={() => setPage(Math.min(page + 1, totalPages))}
									disabled={page >= totalPages || loading}
								>
									Siguiente
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Dialog open={!!viewTicket} onOpenChange={(open) => !open && setViewTicket(null)}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{viewTicket?.subject}</DialogTitle>
						<DialogDescription>
							Para {viewTicket?.recipient_email}
							{viewTicket?.recipient_name ? ` (${viewTicket.recipient_name})` : ""}
						</DialogDescription>
					</DialogHeader>
					{viewTicket && (
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Badge variant={statusVariants[viewTicket.status]}>
									{statusLabels[viewTicket.status]}
								</Badge>
								<Badge variant={emailStatusVariants[viewTicket.email_status]}>
									Correo: {emailStatusLabels[viewTicket.email_status]}
								</Badge>
								<Badge variant="outline">{formatDate(viewTicket.created_at)}</Badge>
							</div>
							<div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">
								{viewTicket.message}
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setViewTicket(null)}>
							Cerrar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
