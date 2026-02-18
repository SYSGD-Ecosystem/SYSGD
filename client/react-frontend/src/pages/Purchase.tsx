import  { type FC, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useBillingData from "@/hooks/connection/useBillingData";
import api from "@/lib/api";
import { toast } from "sonner";
import {
	History,
	Package,
	LayoutDashboard,
	Menu,
	Wallet,
	AlertCircle,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useWeb3 } from "@/components/billing/hooks/useWeb3";
import useOrders from "@/components/billing/hooks/useOrders";
import PurchaseOrders from "@/components/billing/PurchaseOrders";
import PurchaseSidebar from "@/components/billing/components/PurchaseSidebar";
import PurchaseModal from "@/components/billing/components/PurchaseModal";
//import PurchaseCredits from "@/components/billing/PurchaseCredits";
import PurchasePlans from "@/components/billing/PurchasePlans";
import type { Product } from "@/components/billing/components/ProductCard";
import PurchaseCredits from "@/components/billing/PurchaseCredist";

// Definición de las secciones
type Section = "credits" | "plans" | "transactions" | "categories";

const Purchase: FC = () => {
	const usdtAddress = "0xbf1d573d4ce347b7ba0f198028cca36df7aeaf9b";
	const paymentGatewayAddress = "0x484cad0b7237dfda563f976ce54a53af1b515a5c";

	const [activeSection, setActiveSection] = useState<Section>("credits");
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [showTestnetAlert, setShowTestnetAlert] = useState(true);

	const { address, isConnected, usdtBalance, chainId, connect, disconnect } =
		useWeb3(usdtAddress, paymentGatewayAddress);

	const { orders, loadOrders } = useOrders(address);
	const { billing } = useBillingData();
	const [priority, setPriority] = useState("bonus,plan,purchased");

	const loadOrdersWrapper = async () => {
		await loadOrders();
	};

	useEffect(() => {
		const buckets = billing?.credit_spending_priority;
		if (buckets && buckets.length === 3) {
			setPriority(buckets.join(","));
		}
	}, [billing]);

	const savePriority = async (value: string) => {
		setPriority(value);
		try {
			await api.put("/api/users/me/credit-priority", { priority: value.split(",") });
			toast.success("Prioridad de gasto actualizada");
		} catch (error) {
			toast.error("No se pudo actualizar la prioridad de gasto");
		}
	};

	// Cargar órdenes al conectar wallet
	useEffect(() => {
		if (isConnected && address) {
			loadOrders();
		}
	}, [isConnected, address]);

	const navItems = [
		{ id: "credits", label: "Comprar Créditos", icon: Zap },
		{ id: "plans", label: "Planes Suscripción", icon: Package },
		{ id: "transactions", label: "Historial", icon: History },
		{ id: "categories", label: "Uso de Créditos", icon: LayoutDashboard },
	];

	// Nombre de la red
	const networkName =
		chainId === 11155111
			? "Sepolia Testnet"
			: chainId === 1
				? "Ethereum Mainnet"
				: "Red desconocida";

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<AlertDialog open={showTestnetAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Atención</AlertDialogTitle>
						<AlertDialogDescription className="space-y-2">
							<p>
								Las funciones de pago y compra de créditos están en fase de
								prueba. Por el momento, solo es posible utilizarlas mediante un
								token de prueba en la red Testnet Sepolia.
							</p>
							<p>
								Si deseas probar estas funcionalidades, envía un correo
								electrónico al administrador de la plataforma a{" "}
								<strong>lazaroyunier96@outlook.es</strong> para recibir créditos
								de prueba.
							</p>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowTestnetAlert(false)}>
							Entendido
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* SIDEBAR ESCRITORIO */}
			<aside className="hidden md:flex w-64 border-r bg-card flex-col">
				<PurchaseSidebar
					navItems={navItems}
					activeSection={activeSection}
					setActiveSection={setActiveSection}
				/>
			</aside>

			{/* ÁREA PRINCIPAL */}
			<div className="flex flex-col flex-1 min-w-0">
				{/* HEADER SUPERIOR */}
				<header className="h-16 border-b flex items-center justify-between px-4 lg:px-8 bg-card shrink-0">
					<div className="flex items-center gap-4">
						{/* MENÚ MÓVIL */}
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" className="md:hidden">
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent side="left" className="w-64 p-0">
								<PurchaseSidebar
									navItems={navItems}
									activeSection={activeSection}
									setActiveSection={setActiveSection}
								/>
							</SheetContent>
						</Sheet>

						<h1 className="text-lg font-semibold capitalize hidden sm:block">
							{activeSection === "credits" && "Comprar Créditos"}
							{activeSection === "plans" && "Planes de Suscripción"}
							{activeSection === "transactions" && "Historial de Compras"}
							{activeSection === "categories" && "Uso de Créditos"}
						</h1>
					</div>

					{/* CONEXIÓN WALLET + BALANCE */}
					<div className="flex items-center gap-4">
						{!isConnected ? (
							<Button onClick={connect} size="sm">
								<Wallet className="mr-2 h-4 w-4" />
								Conectar Wallet
							</Button>
						) : (
							<div className="flex items-center gap-3">
								{/* Balance USDT */}
								<div className="text-right hidden sm:block">
									<div className="text-xs text-muted-foreground">
										Balance USDT
									</div>
									<div className="font-semibold">${usdtBalance}</div>
								</div>

								{/* Red + Dirección */}
								<div className="flex flex-col items-end">
									<Badge variant="secondary" className="text-xs">
										{networkName}
									</Badge>
									<Button
										variant="outline"
										size="sm"
										onClick={disconnect}
										className="mt-1 text-xs"
									>
										{address?.slice(0, 6)}...{address?.slice(-4)}
									</Button>
								</div>
							</div>
						)}
					</div>
				</header>

				{/* CONTENIDO SCROLLABLE */}
				<main className="flex-1 overflow-y-auto p-4 lg:p-8">
					<div className="max-w-6xl mx-auto">
						{/* Créditos */}
						{activeSection === "credits" && (
							<PurchaseCredits
								onPurchaseStart={setSelectedProduct}
								isConnected={isConnected}
							/>
						)}

						{/* Planes */}
						{activeSection === "plans" && (
							<PurchasePlans
								onPurchaseStart={setSelectedProduct}
								isConnected={isConnected}
							/>
						)}

						{/* Historial */}
						{activeSection === "transactions" && (
							<PurchaseOrders orders={orders} loadOrders={loadOrdersWrapper} />
						)}

						{/* Uso de créditos */}
						{activeSection === "categories" && (
							<div className="space-y-6">
								<div className="p-5 border rounded-lg bg-card space-y-2">
									<h3 className="font-semibold">Cómo se consumen tus créditos</h3>
									<p className="text-sm text-muted-foreground">Los créditos del plan se renuevan cada 30 días. Los bonos expiran según su fecha, y los comprados no se reinician.</p>
									<ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
										<li>Plan gratuito: 10 créditos mensuales.</li>
										<li>Prioridad configurable: bonos, plan o comprados.</li>
										<li>Los bonos se consumen según disponibilidad y expiración.</li>
									</ul>
								</div>
								<div className="p-5 border rounded-lg bg-card space-y-4">
									<h3 className="font-semibold">Prioridad de gasto</h3>
									<div className="space-y-2 max-w-md">
										<Label>Selecciona el orden de consumo</Label>
										<Select value={priority} onValueChange={savePriority}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="bonus,plan,purchased">Bonos → Plan → Comprados</SelectItem>
												<SelectItem value="plan,bonus,purchased">Plan → Bonos → Comprados</SelectItem>
												<SelectItem value="purchased,bonus,plan">Comprados → Bonos → Plan</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{billing && (
										<div className="text-sm text-muted-foreground space-y-1">
											<div>Créditos plan: {billing.plan_credits ?? 0}</div>
											<div>Créditos comprados: {billing.purchased_credits ?? 0}</div>
											<div>Bonos: {(billing.bonus_credits ?? []).reduce((acc, item) => acc + item.amount, 0)}</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Alerta si no está conectado */}
						{!isConnected &&
							activeSection !== "transactions" &&
							activeSection !== "categories" && (
								<Alert className="mt-8">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										Conecta tu wallet para ver precios y realizar compras con
										USDT.
									</AlertDescription>
								</Alert>
							)}
					</div>
				</main>
			</div>

			{/* MODAL DE COMPRA */}
			{selectedProduct && (
				<PurchaseModal
					product={selectedProduct}
					isOpen={!!selectedProduct}
					onClose={() => setSelectedProduct(null)}
					usdtBalance={usdtBalance}
					isConnected={isConnected}
					address={address}
					onPurchaseComplete={async () => {
						await loadOrders();
						// Opcional: aquí podrías recargar otros datos si es necesario
					}}
				/>
			)}
		</div>
	);
};

export default Purchase;
