import { useMemo, useState } from "react"
import { CheckCircle2, Search, XCircle } from "lucide-react"

import { useApklisClaims } from "../../../hooks/connection/useApklisClaims"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Textarea } from "../../../components/ui/textarea"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog"
import type { ApklisClaimOrder, ApklisClaimStatus } from "../../../types/apklisClaim"

const statusLabels: Record<ApklisClaimStatus, string> = {
	pending_review: "Pendiente",
	approved: "Aprobada",
	rejected: "Rechazada",
	expired: "Expirada",
}

const statusVariants: Record<ApklisClaimStatus, "default" | "secondary" | "destructive" | "outline"> = {
	pending_review: "secondary",
	approved: "default",
	rejected: "destructive",
	expired: "outline",
}

const formatDate = (value: string | null) => {
	if (!value) return "Sin fecha"
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? "Sin fecha" : parsed.toLocaleString("es-CU")
}

const formatCup = (value: string | null) => {
	if (value === null) return "No detectado"
	return `${Number(value).toFixed(2)} CUP`
}

const durationLabel = (days: number) => {
	if (days >= 365) return "1 año"
	if (days >= 90) return "3 meses"
	return "1 mes"
}

export default function ApklisClaimsPage() {
	const { orders, loading, reviewOrder } = useApklisClaims()
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedOrder, setSelectedOrder] = useState<ApklisClaimOrder | null>(null)
	const [reviewNotes, setReviewNotes] = useState("")
	const [submitting, setSubmitting] = useState<"approved" | "rejected" | null>(null)

	const filteredOrders = useMemo(
		() =>
			orders.filter((order) =>
				[
					order.id_compra,
					order.transaction_no || "",
					order.apklis_licence_name,
					order.apklis_username || "",
					order.user_email,
					order.user_name,
					order.status,
				]
					.join(" ")
					.toLowerCase()
					.includes(searchTerm.toLowerCase()),
			),
		[orders, searchTerm],
	)

	const pendingCount = orders.filter((order) => order.status === "pending_review").length

	const openReviewDialog = (order: ApklisClaimOrder) => {
		setSelectedOrder(order)
		setReviewNotes(order.review_notes || "")
	}

	const handleReview = async (status: "approved" | "rejected") => {
		if (!selectedOrder) return
		setSubmitting(status)
		try {
			await reviewOrder(selectedOrder.id, { status, reviewNotes })
			setSelectedOrder(null)
			setReviewNotes("")
		} finally {
			setSubmitting(null)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Reclamos Apklis</h1>
					<p className="text-muted-foreground">
						Solicitudes de plan Pro por compra de licencia en Apklis. Aprueba para activar el plan real o rechaza si la evidencia no coincide.
					</p>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Total</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{orders.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Pendientes</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{pendingCount}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{orders.filter((order) => order.status === "approved").length}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-4">
						<div>
							<CardTitle>Solicitudes registradas</CardTitle>
							<CardDescription>
								Verifica el Id Compra contra tu SMS de comerciante antes de aprobar.
							</CardDescription>
						</div>
						<div className="relative w-full max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								placeholder="Buscar por Id Compra, usuario o licencia"
								className="pl-10"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{loading ? (
						<p className="text-sm text-muted-foreground">Cargando reclamos...</p>
					) : filteredOrders.length === 0 ? (
						<p className="text-sm text-muted-foreground">No hay reclamos para mostrar.</p>
					) : (
						filteredOrders.map((order) => (
							<div key={order.id} className="rounded-xl border p-4">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											<p className="font-semibold">
												Licencia {order.apklis_licence_name} · {durationLabel(order.apklis_licence_days)}
											</p>
											<Badge variant={statusVariants[order.status]}>
												{statusLabels[order.status]}
											</Badge>
										</div>
										<div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
											<p>Id Compra: {order.id_compra}</p>
											<p>Transacción: {order.transaction_no || "No detectada"}</p>
											<p>Cuenta: {order.user_name} ({order.user_email})</p>
											<p>Usuario Apklis: {order.apklis_username || "No indicado"}</p>
											<p>Esperado: {Number(order.expected_amount_cup).toFixed(2)} CUP</p>
											<p>SMS: {formatCup(order.sms_amount_cup)} · pagado {formatCup(order.sms_amount_paid_cup)}</p>
											<p>Creada: {formatDate(order.created_at)}</p>
											<p>Fecha SMS: {formatDate(order.sms_payment_date)}</p>
										</div>
										{order.review_notes && (
											<p className="text-sm text-muted-foreground">
												Revisión: {order.review_notes}
											</p>
										)}
									</div>
									<div className="flex flex-wrap gap-2">
										<Button variant="outline" onClick={() => openReviewDialog(order)}>
											Ver detalle
										</Button>
									</div>
								</div>
							</div>
						))
					)}
				</CardContent>
			</Card>

			<Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Revisar reclamo Apklis</DialogTitle>
						<DialogDescription>
							Valida el SMS de pago en línea y decide si se activa el plan Pro del usuario.
						</DialogDescription>
					</DialogHeader>

					{selectedOrder && (
						<div className="space-y-4">
							<div className="grid gap-3 md:grid-cols-2 text-sm">
								<div className="rounded-lg border p-3">
									<p className="font-medium">Compra</p>
									<p className="mt-2">Id Compra: {selectedOrder.id_compra}</p>
									<p>Transacción: {selectedOrder.transaction_no || "No detectada"}</p>
									<p>Licencia: {selectedOrder.apklis_licence_name} ({selectedOrder.apklis_licence_days} días)</p>
									<p>Esperado: {Number(selectedOrder.expected_amount_cup).toFixed(2)} CUP</p>
									<p>SMS: {formatCup(selectedOrder.sms_amount_cup)} · pagado {formatCup(selectedOrder.sms_amount_paid_cup)}</p>
								</div>
								<div className="rounded-lg border p-3">
									<p className="font-medium">Solicitante</p>
									<p className="mt-2">Cuenta: {selectedOrder.user_name}</p>
									<p>Correo: {selectedOrder.user_email}</p>
									<p>Usuario Apklis: {selectedOrder.apklis_username || "No indicado"}</p>
									<p>Estado: {statusLabels[selectedOrder.status]}</p>
									<p>Creada: {formatDate(selectedOrder.created_at)}</p>
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium">SMS pegado por el usuario</p>
								<div className="max-h-60 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
									{selectedOrder.sms_message}
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium">Notas de revisión</p>
								<Textarea
									value={reviewNotes}
									onChange={(event) => setReviewNotes(event.target.value)}
									placeholder="Opcional: deja una nota sobre la revisión"
								/>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:justify-between">
						<Button
							variant="destructive"
							onClick={() => void handleReview("rejected")}
							disabled={!selectedOrder || submitting !== null}
						>
							<XCircle className="mr-2 h-4 w-4" />
							{submitting === "rejected" ? "Rechazando..." : "Rechazar"}
						</Button>
						<Button
							onClick={() => void handleReview("approved")}
							disabled={!selectedOrder || submitting !== null}
						>
							<CheckCircle2 className="mr-2 h-4 w-4" />
							{submitting === "approved" ? "Aprobando..." : "Aprobar y activar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
