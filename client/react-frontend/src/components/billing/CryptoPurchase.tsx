import React, { useState, useEffect } from "react";
import {
	Wallet,
	CreditCard,
	Zap,
	Star,
	Check,
	Loader2,
	AlertCircle,
	ExternalLink,
	Copy,
	CheckCircle2,
	RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useWeb3 } from "./hooks/useWeb3";
import LoadingLogo from "../LoadingLogo";
import PurchaseOrders from "./PurchaseOrders";

// Tipos
export interface Product {
	productId: string;
	price: string;
	active: boolean;
	description: string;
}

export interface NetworkInfo {
	chainId: number;
	name: string;
	testUsdtAddress: string;
	paymentGatewayAddress: string;
}

export interface Order {
	id: string;
	order_id: string;
	user_id: string;
	wallet_address: string;
	product_id: string;
	amount: string;
	status: "pending" | "processing" | "completed" | "failed" | "expired";
	tx_hash?: string;
	created_at: string;
	completed_at?: string;
}

const CryptoPurchase: React.FC = () => {
	const [error, setError] = useState<string | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [purchaseStep, setPurchaseStep] = useState<
		"select" | "approve" | "pay" | "complete"
	>("select");
	const [txHash, setTxHash] = useState("");
	const [processing, setProcessing] = useState(false);
	const [copied, setCopied] = useState(false);
	const [orders, setOrders] = useState<Order[]>([]);
	const [isVerifying, setIsVerifying] = useState(false);
	// const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
	const { toast } = useToast();

	// const { address, isConnected, balance, connect, disconnect } = useWeb3Mock();
	const usdtAddress = "0xbf1d573d4ce347b7ba0f198028cca36df7aeaf9b";
	const paymentGatewayAddress = "0x484cad0b7237dfda563f976ce54a53af1b515a5c";

	const {
		address,
		isConnected,
		usdtBalance,
		connect,
		disconnect,
		approveUSDT,
		processPayment,
	} = useWeb3(usdtAddress, paymentGatewayAddress);

	useEffect(() => {
		loadProducts();
		loadNetworkInfo();
		loadOrders();
	}, []);

	const loadProducts = async () => {
		try {
			const response = await api.get<Product[]>(
				"/api/crypto-payments/products",
			);
			setProducts(response.data);
		} catch (error) {
			console.error("Error loading products:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description: "No se pudieron cargar los productos",
			});
			setError("No se pudieron cargar los productos");
		} finally {
			setLoading(false);
		}
	};

	const loadNetworkInfo = async () => {
		try {
			const response = await api.get<NetworkInfo>(
				"/api/crypto-payments/network",
			);
			setNetworkInfo(response.data);
		} catch (error) {
			console.error("Error loading network:", error);
		}
	};

	const loadOrders = async () => {
		try {
			const response = await api.get("/api/crypto-payments/orders", {
				params: { walletAddress: address },
			});
			setOrders(response.data);
		} catch (error) {
			console.error("Error loading orders:", error);
			return [];
		}
	};

	const reloadOrders = async () => {
		await loadOrders();
	};

	const handleSelectProduct = (product: Product) => {
		setSelectedProduct(product);
		setPurchaseStep("approve");
	};

	const handleApprove = async () => {
		if (!selectedProduct || !address) return;

		setProcessing(true);
		try {
			// Simular aprobación de USDT
			//await new Promise(resolve => setTimeout(resolve, 2000));
			await approveUSDT(selectedProduct.price);

			toast({
				title: "Aprobación exitosa",
				description: "Puedes proceder con el pago",
			});

			setPurchaseStep("pay");
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "No se pudo aprobar el USDT",
			});
		} finally {
			setProcessing(false);
		}
	};


	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const resetPurchase = () => {
		setSelectedProduct(null);
		setPurchaseStep("select");
		setTxHash("");
	};

	/**
	 * Verifica el estado de una orden después del pago
	 */
	const verifyOrderCompletion = async (orderId: string): Promise<boolean> => {
		const maxAttempts = 20; // 20 intentos
		const interval = 3000; // cada 3 segundos

		for (let i = 0; i < maxAttempts; i++) {
			try {
				const response = await api.get(
					`/api/crypto-payments/orders/${orderId}`,
				);
				const order = response.data;

				if (order.status === "completed") {
					console.log("✅ Pago confirmado en blockchain!");
					return true;
				}

				if (order.status === "failed" || order.status === "expired") {
					console.log("❌ Pago falló o expiró");
					return false;
				}

				// Esperar antes del siguiente intento
				await new Promise((resolve) => setTimeout(resolve, interval));
			} catch (error) {
				console.error("Error verificando orden:", error);
			}
		}

		return false; // Timeout
	};

	// Actualizar la función handlePay
	const handlePay = async () => {
		if (!selectedProduct || !address) return;

		setProcessing(true);
		setIsVerifying(false);

		try {
			// 1. Crear orden en backend
			const orderResponse = await api.post("/api/crypto-payments/orders", {
				productId: selectedProduct.productId,
				walletAddress: address,
			});

			const order = orderResponse.data;

			// 2. Procesar pago en blockchain
			const txHash = await processPayment(
				selectedProduct.productId,
				order.order_id,
			);

			setTxHash(txHash);
			setProcessing(false);
			setIsVerifying(true);

			toast({
				title: "Transacción enviada",
				description: "Verificando confirmación en blockchain...",
			});

			// 3. Verificar que el pago se complete
			const completed = await verifyOrderCompletion(order.order_id);

			setIsVerifying(false);

			if (completed) {
				toast({
					title: "¡Pago completado!",
					description: "Tus créditos han sido agregados a tu cuenta",
				});
				setPurchaseStep("complete");

				// Recargar órdenes y balance
				await loadOrders();
			} else {
				toast({
					variant: "destructive",
					title: "Verificación timeout",
					description: "El pago puede demorar unos minutos en confirmarse",
				});
			}
		} catch (error: any) {
			setIsVerifying(false);
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error.response?.data?.error || "No se pudo procesar el pago",
			});
		} finally {
			setProcessing(false);
		}
	};


	// Agrupar productos por tipo
	const creditProducts = products.filter((p) =>
		p.productId.startsWith("credits_"),
	);
	const planProducts = products.filter((p) => p.productId.startsWith("plan_"));

	const ProductCard: React.FC<{ product: Product; featured?: boolean }> = ({
		product,
		featured,
	}) => {
		const isCredit = product.productId.startsWith("credits_");
		const credits = isCredit ? product.productId.split("_")[1] : null;
		const isPlan = product.productId.startsWith("plan_");
		const [, tier, period] = isPlan
			? product.productId.split("_")
			: ["", "", ""];

		return (
			<Card
				className={`relative ${featured ? "border-primary shadow-lg" : ""}`}
			>
				{featured && (
					<Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
						Más Popular
					</Badge>
				)}
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-xl">
							{isCredit && `${credits} Créditos`}
							{isPlan && (
								<>
									{tier === "pro" ? (
										<Zap className="inline h-5 w-5 mr-1" />
									) : (
										<Star className="inline h-5 w-5 mr-1 fill-current" />
									)}
									{tier.toUpperCase()}
								</>
							)}
						</CardTitle>
						<div className="text-right">
							<div className="text-2xl font-bold">${product.price}</div>
							<div className="text-xs text-muted-foreground">USDT</div>
						</div>
					</div>
					<CardDescription>{product.description}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{isCredit && (
							<>
								<div className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									<span>{credits} peticiones a IA</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									<span>Válidos por 1 año</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									<span>Sin expiración</span>
								</div>
							</>
						)}
						{isPlan && (
							<>
								<div className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									<span>Proyectos ilimitados</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									<span>Documentos ilimitados</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									<span>GitHub Integration</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									<span>
										{tier === "pro" ? "100" : "500"} créditos AI/
										{period === "monthly" ? "mes" : "año"}
									</span>
								</div>
								{tier === "vip" && (
									<div className="flex items-center gap-2 text-sm">
										<Check className="h-4 w-4 text-green-500" />
										<span>Soporte prioritario</span>
									</div>
								)}
							</>
						)}
					</div>
				</CardContent>
				<CardFooter>
					<Button
						className="w-full"
						onClick={() => handleSelectProduct(product)}
						disabled={!isConnected}
					>
						<CreditCard className="mr-2 h-4 w-4" />
						Comprar
					</Button>
				</CardFooter>
			</Card>
		);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<LoadingLogo />
			</div>
		);
	}

	if (error) {
		return (
			<div className="container max-w-7xl mx-auto p-6 space-y-6">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
					<Button
						variant="outline"
						className="ml-4"
						onClick={() => {
							setError(null);
							setLoading(true);
							loadProducts().finally(() => setLoading(false));
						}}
					>
						<RefreshCw className="h-4 w-4 mr-2" />
						Intentar de nuevo
					</Button>
				</Alert>
			</div>
		);
	}

	return (
		<div className="container max-w-7xl mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Comprar Créditos y Planes</h1>
					<p className="text-muted-foreground mt-1">
						Paga de forma segura con criptomonedas (USDT)
					</p>
				</div>

				{/* Wallet Connection */}
				{!isConnected ? (
					<Button onClick={connect} size="lg">
						<Wallet className="mr-2 h-4 w-4" />
						Conectar Wallet
					</Button>
				) : (
					<div className="flex items-center gap-4">
						<div className="text-right">
							<div className="text-sm text-muted-foreground">Balance USDT</div>
							<div className="text-xl font-bold">${usdtBalance}</div>
						</div>
						<Button variant="outline" onClick={disconnect}>
							{address!.slice(0, 6)}...{address!.slice(-4)}
						</Button>
					</div>
				)}
			</div>

			{/* Network Info */}
			{networkInfo && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Conectado a <strong>{networkInfo.name}</strong> (ChainID:{" "}
						{networkInfo.chainId})
						{networkInfo.chainId === 11155111 && (
							<span className="ml-2 text-xs">
								• Usa el faucet para obtener TUSDT de prueba
							</span>
						)}
					</AlertDescription>
				</Alert>
			)}

			{/* Purchase Modal */}
			{selectedProduct && purchaseStep !== "select" && (
				<Card className="border-2 border-primary">
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>Proceso de Compra</span>
							<Button variant="ghost" size="sm" onClick={resetPurchase}>
								Cancelar
							</Button>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Progress Steps */}
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>
									Paso{" "}
									{purchaseStep === "approve"
										? "1"
										: purchaseStep === "pay"
											? "2"
											: "3"}{" "}
									de 3
								</span>
								<span className="text-muted-foreground">
									{purchaseStep === "approve" && "Aprobar USDT"}
									{purchaseStep === "pay" && "Confirmar Pago"}
									{purchaseStep === "complete" && "Completado"}
								</span>
							</div>
							<Progress
								value={
									purchaseStep === "approve"
										? 33
										: purchaseStep === "pay"
											? 66
											: 100
								}
							/>
						</div>

						{/* Product Summary */}
						<div className="bg-muted p-4 rounded-lg space-y-2">
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">Producto</span>
								<span className="font-medium">
									{selectedProduct.description}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">Precio</span>
								<span className="font-bold text-lg">
									${selectedProduct.price} USDT
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">
									Tu balance
								</span>
								<span
									className={
										parseFloat(usdtBalance) >= parseFloat(selectedProduct.price)
											? "text-green-600"
											: "text-red-600"
									}
								>
									${usdtBalance} USDT
								</span>
							</div>
						</div>

						{/* Step Content */}
						{purchaseStep === "approve" && (
							<div className="space-y-4">
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										Primero debes aprobar que el contrato pueda usar tus USDT.
										Esta es una transacción segura estándar de Ethereum.
									</AlertDescription>
								</Alert>
								<Button
									onClick={handleApprove}
									className="w-full"
									size="lg"
									disabled={
										processing ||
										parseFloat(usdtBalance) < parseFloat(selectedProduct.price)
									}
								>
									{processing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Aprobando...
										</>
									) : (
										<>
											<Check className="mr-2 h-4 w-4" />
											Aprobar USDT
										</>
									)}
								</Button>
							</div>
						)}

						{/* {purchaseStep === "pay" && (
							<div className="space-y-4">
								<Alert>
									<CheckCircle2 className="h-4 w-4 text-green-600" />
									<AlertDescription>
										¡USDT aprobado! Ahora puedes proceder con el pago final.
									</AlertDescription>
								</Alert>
								<Button
									onClick={handlePay}
									className="w-full"
									size="lg"
									disabled={processing}
								>
									{processing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Procesando pago...
										</>
									) : (
										<>
											<Wallet className="mr-2 h-4 w-4" />
											Confirmar Pago
										</>
									)}
								</Button>
							</div>
						)} */}

						{purchaseStep === "pay" && (
							<div className="space-y-4">
								<Alert>
									<CheckCircle2 className="h-4 w-4 text-green-600" />
									<AlertDescription>
										¡USDT aprobado! Ahora puedes proceder con el pago final.
									</AlertDescription>
								</Alert>
								<Button
									onClick={handlePay}
									className="w-full"
									size="lg"
									disabled={processing || isVerifying}
								>
									{isVerifying ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Verificando en blockchain...
										</>
									) : processing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Procesando pago...
										</>
									) : (
										<>
											<Wallet className="mr-2 h-4 w-4" />
											Confirmar Pago
										</>
									)}
								</Button>
								{isVerifying && (
									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>
											Esperando confirmación de la transacción en blockchain.
											Esto puede tomar 1-2 minutos.
										</AlertDescription>
									</Alert>
								)}
							</div>
						)}

						{purchaseStep === "complete" && (
							<div className="space-y-4 text-center">
								<div className="flex justify-center">
									<CheckCircle2 className="h-16 w-16 text-green-600" />
								</div>
								<div>
									<h3 className="text-xl font-bold mb-2">¡Compra Exitosa!</h3>
									<p className="text-muted-foreground">
										Tu compra ha sido procesada correctamente. Los créditos se
										agregarán a tu cuenta en unos momentos.
									</p>
								</div>
								{txHash && (
									<div className="bg-muted p-3 rounded-lg">
										<div className="text-xs text-muted-foreground mb-1">
											Hash de transacción:
										</div>
										<div className="flex items-center gap-2">
											<code className="text-xs flex-1 truncate">{txHash}</code>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => copyToClipboard(txHash)}
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
												onClick={() =>
													window.open(
														`https://sepolia.etherscan.io/tx/${txHash}`,
														"_blank",
													)
												}
											>
												<ExternalLink className="h-3 w-3" />
											</Button>
										</div>
									</div>
								)}
								<Button onClick={resetPurchase} className="w-full">
									Hacer otra compra
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Products Display */}
			{purchaseStep === "select" && (
				<>
					{!isConnected && (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								Conecta tu wallet para poder comprar créditos y planes
							</AlertDescription>
						</Alert>
					)}

					<Tabs defaultValue="credits">
						<TabsList className="grid w-full grid-cols-3 max-w-md">
							<TabsTrigger value="credits">
								<Zap className="mr-2 h-4 w-4" />
								Créditos AI
							</TabsTrigger>
							<TabsTrigger value="plans">
								<Star className="mr-2 h-4 w-4" />
								Planes
							</TabsTrigger>
							<TabsTrigger value="orders">
								<Wallet className="mr-2 h-4 w-4" />
								Mis Órdenes
							</TabsTrigger>
						</TabsList>

						<TabsContent value="credits" className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{creditProducts.map((product, idx) => (
									<ProductCard
										key={product.productId}
										product={product}
										featured={idx === 2} // Destacar el tercer producto
									/>
								))}
							</div>
						</TabsContent>

						<TabsContent value="plans" className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{planProducts.map((product) => (
									<ProductCard
										key={product.productId}
										product={product}
										featured={product.productId.includes("yearly")}
									/>
								))}
							</div>
						</TabsContent>
						<TabsContent value="orders" className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<PurchaseOrders orders={orders} loadOrders={reloadOrders} />
							</div>
						</TabsContent>
					</Tabs>
				</>
			)}

			{/* Info Footer */}
			<Card className="bg-muted/50">
				<CardHeader>
					<CardTitle className="text-sm">Información de Pago</CardTitle>
				</CardHeader>
				<CardContent className="text-sm space-y-2">
					<div className="flex items-start gap-2">
						<Check className="h-4 w-4 text-green-600 mt-0.5" />
						<span>Pagos seguros procesados en blockchain</span>
					</div>
					<div className="flex items-start gap-2">
						<Check className="h-4 w-4 text-green-600 mt-0.5" />
						<span>Sin intermediarios ni comisiones ocultas</span>
					</div>
					<div className="flex items-start gap-2">
						<Check className="h-4 w-4 text-green-600 mt-0.5" />
						<span>Transacciones verificables en blockchain explorer</span>
					</div>
					<div className="flex items-start gap-2">
						<Check className="h-4 w-4 text-green-600 mt-0.5" />
						<span>Créditos agregados automáticamente después del pago</span>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default CryptoPurchase;
