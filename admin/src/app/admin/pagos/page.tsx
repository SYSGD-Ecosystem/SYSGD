import { useMemo, useState } from "react"
import { CheckCircle2, Search, XCircle } from "lucide-react"

import { useManualPayments } from "../../../hooks/connection/useManualPayments"
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
import type { ManualPaymentOrder, ManualPaymentStatus } from "../../../types/manualPayment"

const statusLabels: Record<ManualPaymentStatus, string> = {
	pending_review: "Pendiente",
	provisional: "Provisional",
	approved: "Aprobada",
	rejected: "Rechazada",
	expired: "Expirada",
}

const statusVariants: Record<ManualPaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
	pending_review: "secondary",
	provisional: "default",
	approved: "default",
	rejected: "destructive",
	expired: "outline",
}

const formatDate = (value: string | null) => {
	if (!value) return "Sin fecha"
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? "Sin fecha" : parsed.toLocaleString("es-CU")
}

const durationLabel = (months: 1 | 3 | 12) => {
	if (months === 12) return "1 ano"
	if (months === 3) return "3 meses"
	return "1 mes"
}

export default function ManualPaymentsPage() {
	const { orders, loading, reviewOrder } = useManualPayments()
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedOrder, setSelectedOrder] = useState<ManualPaymentOrder | null>(null)
	const [reviewNotes, setReviewNotes] = useState("")
	const [submitting, setSubmitting] = useState<"approved" | "rejected" | null>(null)

	const filteredOrders = useMemo(
		() =>
			orders.filter((order) =>
				[
					order.product_id,
					order.plan_tier,
					order.payer_phone,
					order.sms_transaction_id || "",
					order.status,
				]
					.join(" ")
					.toLowerCase()
					.includes(searchTerm.toLowerCase()),
			),
		[orders, searchTerm],
	)

	const pendingCount = orders.filter(
		(order) => order.status === "pending_review" || order.status === "provisional",
	).length

	const openReviewDialog = (order: ManualPaymentOrder) => {
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
					<h1 className="text-2xl font-bold text-foreground">Pagos Manuales</h1>
					<p className="text-muted-foreground">
						Revisa compras de Transfermovil y activa los planes reales desde admin.
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
								Aprueba para activar el plan real o rechaza si la evidencia no coincide.
							</CardDescription>
						</div>
						<div className="relative w-full max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								placeholder="Buscar por plan, telefono o transaccion"
								className="pl-10"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{loading ? (
						<p className="text-sm text-muted-foreground">Cargando pagos manuales...</p>
					) : filteredOrders.length === 0 ? (
						<p className="text-sm text-muted-foreground">No hay pagos para mostrar.</p>
					) : (
						filteredOrders.map((order) => (
							<div key={order.id} className="rounded-xl border p-4">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											<p className="font-semibold">
												{order.plan_tier.toUpperCase()} · {durationLabel(order.duration_months)}
											</p>
											<Badge variant={statusVariants[order.status]}>
												{statusLabels[order.status]}
											</Badge>
										</div>
										<div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
											<p>Monto esperado: {Number(order.expected_amount_cup).toFixed(2)} CUP</p>
											<p>Telefono: {order.payer_phone}</p>
											<p>Transaccion: {order.sms_transaction_id || "No detectada"}</p>
											<p>Fecha SMS: {formatDate(order.sms_payment_date)}</p>
											<p>Creada: {formatDate(order.created_at)}</p>
											<p>Gracia: {formatDate(order.grace_expires_at)}</p>
										</div>
										{order.review_notes && (
											<p className="text-sm text-muted-foreground">
												Revision: {order.review_notes}
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
						<DialogTitle>Revisar compra manual</DialogTitle>
						<DialogDescription>
							Valida el mensaje y decide si se activa el plan real del usuario.
						</DialogDescription>
					</DialogHeader>

					{selectedOrder && (
						<div className="space-y-4">
							<div className="grid gap-3 md:grid-cols-2 text-sm">
								<div className="rounded-lg border p-3">
									<p className="font-medium">Resumen</p>
									<p className="mt-2">Plan: {selectedOrder.plan_tier.toUpperCase()}</p>
									<p>Vigencia: {durationLabel(selectedOrder.duration_months)}</p>
									<p>Monto: {Number(selectedOrder.expected_amount_cup).toFixed(2)} CUP</p>
									<p>Telefono: {selectedOrder.payer_phone}</p>
									<p>Transaccion: {selectedOrder.sms_transaction_id || "No detectada"}</p>
								</div>
								<div className="rounded-lg border p-3">
									<p className="font-medium">Estado</p>
									<p className="mt-2">Actual: {statusLabels[selectedOrder.status]}</p>
									<p>Creada: {formatDate(selectedOrder.created_at)}</p>
									<p>Gracia: {formatDate(selectedOrder.grace_expires_at)}</p>
									<p>Revision: {formatDate(selectedOrder.reviewed_at)}</p>
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium">Mensaje pegado por el usuario</p>
								<div className="max-h-60 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
									{selectedOrder.sms_message}
								</div>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium">Notas de revision</p>
								<Textarea
									value={reviewNotes}
									onChange={(event) => setReviewNotes(event.target.value)}
									placeholder="Opcional: deja una nota sobre la revision"
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
