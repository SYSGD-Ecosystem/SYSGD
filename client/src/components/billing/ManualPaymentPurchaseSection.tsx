import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Copy, CreditCard, Phone } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type {
	CreateManualPaymentOrderPayload,
	ManualPaymentCatalogResponse,
	ManualPaymentDurationMonths,
	ManualPaymentOrder,
	ManualPaymentStatus,
} from "@/types/manualPayment";

type ManualOrderResponse = {
	order: ManualPaymentOrder;
};

const statusLabels: Record<ManualPaymentStatus, string> = {
	pending_review: "Pendiente de revision",
	provisional: "Activacion provisional",
	approved: "Aprobada",
	rejected: "Rechazada",
	expired: "Expirada",
};

const statusVariants: Record<
	ManualPaymentStatus,
	"default" | "secondary" | "destructive" | "outline"
> = {
	pending_review: "secondary",
	provisional: "default",
	approved: "default",
	rejected: "destructive",
	expired: "outline",
};

const durationLabel = (months: ManualPaymentDurationMonths) => {
	if (months === 12) return "1 año";
	if (months === 3) return "3 meses";
	return "1 mes";
};

const formatDate = (value: string | null) => {
	if (!value) return "Sin fecha";
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? "Sin fecha" : parsed.toLocaleString("es-CU");
};

const formatAmount = (value: string | number) => `${Number(value).toFixed(2)} CUP`;

const ManualPaymentPurchaseSection = () => {
	const [catalog, setCatalog] = useState<ManualPaymentCatalogResponse | null>(null);
	const [orders, setOrders] = useState<ManualPaymentOrder[]>([]);
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [payerPhone, setPayerPhone] = useState("");
	const [smsMessage, setSmsMessage] = useState("");
	const [confirmationPhoneAcknowledged, setConfirmationPhoneAcknowledged] =
		useState(false);
	const [receiverPhoneShared, setReceiverPhoneShared] = useState(false);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const selectedProduct = useMemo(
		() => catalog?.products.find((product) => product.id === selectedProductId) ?? null,
		[catalog?.products, selectedProductId],
	);

	const loadData = async () => {
		setLoading(true);
		try {
			const [catalogResponse, ordersResponse] = await Promise.all([
				api.get<ManualPaymentCatalogResponse>("/api/manual-payments/products"),
				api.get<{ orders: ManualPaymentOrder[] }>("/api/manual-payments/orders"),
			]);
			setCatalog(catalogResponse.data);
			setOrders(ordersResponse.data.orders);
			if (!selectedProductId && catalogResponse.data.products.length > 0) {
				setSelectedProductId(catalogResponse.data.products[0].id);
			}
		} catch (error) {
			console.error("Error cargando pagos manuales:", error);
			toast.error("No se pudo cargar la compra por Transfermovil");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadData();
	}, []);

	const handleCopy = async (value: string, label: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`${label} copiado`);
		} catch {
			toast.error(`No se pudo copiar ${label.toLowerCase()}`);
		}
	};

	const handleSubmit = async () => {
		if (!selectedProduct) {
			toast.error("Selecciona un plan");
			return;
		}

		const payload: CreateManualPaymentOrderPayload = {
			productId: selectedProduct.id,
			payerPhone,
			smsMessage,
			confirmationPhoneAcknowledged,
			receiverPhoneShared,
		};

		setSubmitting(true);
		try {
			const response = await api.post<ManualOrderResponse>(
				"/api/manual-payments/orders",
				payload,
			);
			const nextOrder = response.data.order;
			setOrders((current) => [nextOrder, ...current]);
			setPayerPhone("");
			setSmsMessage("");
			setConfirmationPhoneAcknowledged(false);
			setReceiverPhoneShared(false);
			toast.success(
				nextOrder.status === "provisional"
					? "Compra registrada con activacion provisional de 7 dias"
					: "Compra registrada para revision manual",
			);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "No se pudo registrar la compra";
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return <div className="py-12 text-center text-muted-foreground">Cargando pagos nacionales...</div>;
	}

	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<h2 className="text-2xl font-bold">Compra nacional por Transfermovil</h2>
				<p className="text-muted-foreground">
					Realiza la transferencia, pega el mensaje recibido y registra tu compra para
					validacion.
				</p>
			</div>

			<Alert>
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Importante antes de transferir</AlertTitle>
				<AlertDescription className="space-y-2">
					{catalog?.instructions.importantNotes.map((note) => (
						<p key={note}>{note}</p>
					))}
				</AlertDescription>
			</Alert>

			<div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
				<Card>
					<CardHeader>
						<CardTitle>Planes disponibles</CardTitle>
						<CardDescription>
							Selecciona el plan y la vigencia que deseas activar en la web.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						{catalog?.products.map((product) => {
							const isSelected = product.id === selectedProductId;
							return (
								<button
									type="button"
									key={product.id}
									onClick={() => setSelectedProductId(product.id)}
									className={`rounded-xl border p-4 text-left transition ${
										isSelected
											? "border-primary bg-primary/5 shadow-sm"
											: "border-border hover:border-primary/40"
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="font-semibold">{product.name}</p>
											<p className="text-sm text-muted-foreground">
												{product.description}
											</p>
										</div>
										<Badge variant={product.tier === "vip" ? "default" : "secondary"}>
											{product.tier.toUpperCase()}
										</Badge>
									</div>
									<div className="mt-4 text-2xl font-bold">
										{product.price_cup} CUP
									</div>
									<p className="mt-1 text-xs text-muted-foreground">
										{durationLabel(product.duration_months)}
										{product.discount_percent > 0
											? ` · ahorro del ${product.discount_percent}%`
											: ""}
									</p>
									<ul className="mt-4 space-y-2 text-sm text-muted-foreground">
										{product.features.map((feature) => (
											<li key={feature} className="flex items-start gap-2">
												<CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
												<span>{feature}</span>
											</li>
										))}
									</ul>
								</button>
							);
						})}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Datos de transferencia</CardTitle>
						<CardDescription>
							Usa estos datos exactamente al pagar por Transfermovil.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-lg border p-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<CreditCard className="h-4 w-4" />
								Tarjeta destino
							</div>
							<div className="mt-2 flex items-center justify-between gap-3">
								<p className="font-mono text-base font-semibold">
									{catalog?.instructions.receiverCard}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										void handleCopy(catalog?.instructions.receiverCard ?? "", "Tarjeta")
									}
								>
									<Copy className="mr-2 h-4 w-4" />
									Copiar
								</Button>
							</div>
						</div>

						<div className="rounded-lg border p-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Phone className="h-4 w-4" />
								Telefono a confirmar
							</div>
							<div className="mt-2 flex items-center justify-between gap-3">
								<p className="font-mono text-base font-semibold">
									{catalog?.instructions.confirmationPhone}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										void handleCopy(
											catalog?.instructions.confirmationPhone ?? "",
											"Telefono",
										)
									}
								>
									<Copy className="mr-2 h-4 w-4" />
									Copiar
								</Button>
							</div>
						</div>

						{selectedProduct && (
							<div className="rounded-lg border bg-muted/40 p-4 text-sm">
								<p className="font-medium">Compra seleccionada</p>
								<p className="mt-2">
									{selectedProduct.name} por {selectedProduct.price_cup} CUP
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Registrar compra</CardTitle>
					<CardDescription>
						Pega el mensaje recibido y dinos desde que numero se realizo la
						transferencia.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="payerPhone">Numero de telefono del comprador</Label>
							<Input
								id="payerPhone"
								value={payerPhone}
								onChange={(event) => setPayerPhone(event.target.value)}
								placeholder="Ej: 55123456"
							/>
						</div>
						<div className="space-y-2">
							<Label>Resumen del plan</Label>
							<div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
								{selectedProduct
									? `${selectedProduct.name} · ${selectedProduct.price_cup} CUP`
									: "Selecciona un plan"}
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="smsMessage">Mensaje recibido de Transfermovil</Label>
						<Textarea
							id="smsMessage"
							value={smsMessage}
							onChange={(event) => setSmsMessage(event.target.value)}
							placeholder={"Pega aqui el mensaje completo de confirmacion de la transferencia"}
							className="min-h-40"
						/>
					</div>

					<div className="space-y-3 rounded-lg border p-4">
						<div className="flex items-start gap-3">
							<Checkbox
								id="confirmationPhoneAcknowledged"
								checked={confirmationPhoneAcknowledged}
								onCheckedChange={(checked) =>
									setConfirmationPhoneAcknowledged(checked === true)
								}
							/>
							<div className="space-y-1">
								<Label htmlFor="confirmationPhoneAcknowledged" className="cursor-pointer">
									Confirme el numero 51158544 en Transfermovil.
								</Label>
								<p className="text-sm text-muted-foreground">
									Si no confirmas ese numero, la verificacion puede retrasarse.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<Checkbox
								id="receiverPhoneShared"
								checked={receiverPhoneShared}
								onCheckedChange={(checked) => setReceiverPhoneShared(checked === true)}
							/>
							<div className="space-y-1">
								<Label htmlFor="receiverPhoneShared" className="cursor-pointer">
									Marque la opcion "El destinatario recibe mi numero de movil".
								</Label>
								<p className="text-sm text-muted-foreground">
									Esto es importante para localizar tu compra sin retrasos.
								</p>
							</div>
						</div>
					</div>

					<div className="flex justify-end">
						<Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
							{submitting ? "Registrando..." : "Registrar compra"}
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Mis compras por Transfermovil</CardTitle>
					<CardDescription>
						Consulta el estado de tus solicitudes y el periodo de gracia si aplica.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{orders.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Aun no has registrado compras manuales.
						</p>
					) : (
						orders.map((order) => (
							<div
								key={order.id}
								className="rounded-xl border p-4"
							>
								<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
									<div>
										<p className="font-medium">
											{order.plan_tier.toUpperCase()} · {durationLabel(order.duration_months)}
										</p>
										<p className="text-sm text-muted-foreground">
											Registrada el {formatDate(order.created_at)}
										</p>
									</div>
									<Badge variant={statusVariants[order.status]}>
										{statusLabels[order.status]}
									</Badge>
								</div>
								<div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
									<div>
										<p className="font-medium text-foreground">Monto esperado</p>
										<p>{formatAmount(order.expected_amount_cup)}</p>
									</div>
									<div>
										<p className="font-medium text-foreground">Transaccion</p>
										<p>{order.sms_transaction_id ?? "No detectada automaticamente"}</p>
									</div>
									<div>
										<p className="font-medium text-foreground">Telefono</p>
										<p>{order.payer_phone}</p>
									</div>
								</div>
								{order.grace_expires_at && (
									<div className="mt-4 rounded-lg bg-primary/5 p-3 text-sm">
										<div className="flex items-center gap-2 font-medium text-foreground">
											<Clock3 className="h-4 w-4" />
											Acceso provisional hasta {formatDate(order.grace_expires_at)}
										</div>
										<p className="mt-1 text-muted-foreground">
											Si la transaccion no se valida antes de esa fecha, la compra
											puede ser invalidada.
										</p>
									</div>
								)}
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default ManualPaymentPurchaseSection;
