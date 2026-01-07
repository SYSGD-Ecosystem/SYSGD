/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useState } from "react";
import { Order } from "../CryptoPurchase";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import {
	Check,
	CheckCircle2,
	Clock,
	Copy,
	ExternalLink,
	Loader2,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const OrderCard: FC<{ order: Order; loadOrders: () => Promise<void> }> = ({
	order,
	loadOrders,
}) => {
	const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const { toast } = useToast();
	const isVerifyingThis = verifyingOrderId === order.order_id;
	const canVerify = order.status === "pending" || order.status === "processing";

	const handleVerifyOrder = async (orderId: string) => {
		setVerifyingOrderId(orderId);
		try {
			const response = await api.get<Order>(
				`/api/crypto-payments/orders/${orderId}`,
			);

			await loadOrders();

			if (response.data.status === "completed") {
				toast({
					title: "Orden completada",
					description: "La transacción ha sido confirmada en blockchain",
				});
			} else if (response.data.status === "pending") {
				toast({
					title: "Orden pendiente",
					description: "La transacción aún no ha sido confirmada",
				});
			}
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "No se pudo verificar la orden",
			});
		} finally {
			setVerifyingOrderId(null);
		}
	};

	const getStatusBadge = (status: Order["status"]) => {
		const styles = {
			pending: {
				variant: "secondary" as const,
				icon: Clock,
				text: "Pendiente",
			},
			processing: {
				variant: "default" as const,
				icon: Loader2,
				text: "Procesando",
			},
			completed: {
				variant: "default" as const,
				icon: CheckCircle2,
				text: "Completado",
				className: "bg-green-600",
			},
			failed: {
				variant: "destructive" as const,
				icon: XCircle,
				text: "Fallido",
			},
			expired: {
				variant: "destructive" as const,
				icon: XCircle,
				text: "Expirado",
			},
		};

		const style = styles[status];
		const Icon = style.icon;

		return (
			<Badge variant={style.variant}>
				<Icon className="h-3 w-3 mr-1" />
				{style.text}
			</Badge>
		);
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardTitle className="text-base">
							Orden #{order.order_id.split("_")[1].slice(0, 8)}
						</CardTitle>
						<CardDescription className="text-xs">
							{order.product_id}
						</CardDescription>
					</div>
					{getStatusBadge(order.status)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{/* Monto */}
					<div className="flex items-center justify-between py-2 border-b">
						<span className="text-sm text-muted-foreground">Monto</span>
						<span className="font-semibold">${order.amount} USDT</span>
					</div>

					{/* Fecha de creación */}
					<div className="flex items-center justify-between py-2 border-b">
						<span className="text-sm text-muted-foreground">Fecha</span>
						<span className="text-sm">
							{new Date(order.created_at).toLocaleString("es-ES", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</span>
					</div>

					{/* Fecha de completado */}
					{order.completed_at && (
						<div className="flex items-center justify-between py-2 border-b">
							<span className="text-sm text-muted-foreground">Completado</span>
							<span className="text-sm">
								{new Date(order.completed_at).toLocaleString("es-ES", {
									day: "2-digit",
									month: "short",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
					)}
					{/* Wallet Address */}
					<div className="flex items-center justify-between py-2 border-b">
						<span className="text-sm text-muted-foreground">Wallet</span>
						<div className="flex items-center gap-2">
							<code className="text-xs bg-muted px-2 py-1 rounded">
								{order.wallet_address.slice(0, 6)}...
								{order.wallet_address.slice(-4)}
							</code>
							<Button
								size="sm"
								variant="ghost"
								className="h-6 w-6 p-0"
								onClick={() =>
									window.open(
										`https://sepolia.etherscan.io/address/${order.wallet_address}`,
										"_blank",
									)
								}
							>
								<ExternalLink className="h-3 w-3" />
							</Button>
						</div>
					</div>

					{/* Transaction Hash */}
					{order.tx_hash && (
						<div className="py-2">
							<span className="text-sm text-muted-foreground block mb-2">
								Hash de Transacción
							</span>
							<div className="flex items-center gap-2 bg-muted p-2 rounded">
								<code className="text-xs flex-1 truncate">{order.tx_hash}</code>
								<Button
									size="sm"
									variant="ghost"
									className="h-6 w-6 p-0"
									onClick={() => copyToClipboard(order.tx_hash!)}
								>
									{copied ? (
										<Check className="h-3 w-3" />
									) : (
										<Copy className="h-3 w-3" />
									)}
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="h-6 w-6 p-0"
									onClick={() =>
										window.open(
											`https://sepolia.etherscan.io/tx/${order.tx_hash}`,
											"_blank",
										)
									}
								>
									<ExternalLink className="h-3 w-3" />
								</Button>
							</div>
						</div>
					)}
				</div>
			</CardContent>
			<CardFooter className="flex gap-2">
				<Button
					size="sm"
					variant="outline"
					className="flex-1"
					onClick={() =>
						window.open(
							`https://sepolia.etherscan.io/address/${order.wallet_address}`,
							"_blank",
						)
					}
				>
					<ExternalLink className="h-3 w-3 mr-2" />
					Ver en Etherscan
				</Button>
				{canVerify && (
					<Button
						size="sm"
						variant="default"
						className="flex-1"
						onClick={() => handleVerifyOrder(order.order_id)}
						disabled={isVerifyingThis}
					>
						{isVerifyingThis ? (
							<>
								<Loader2 className="h-3 w-3 mr-2 animate-spin" />
								Verificando...
							</>
						) : (
							<>
								<RefreshCw className="h-3 w-3 mr-2" />
								Verificar Estado
							</>
						)}
					</Button>
				)}
			</CardFooter>
		</Card>
	);
};

export default OrderCard;
