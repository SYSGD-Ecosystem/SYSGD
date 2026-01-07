import  { type FC, useState, useEffect } from "react";
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

	const { address, isConnected, usdtBalance, chainId, connect, disconnect } =
		useWeb3(usdtAddress, paymentGatewayAddress);

	const { orders, loadOrders } = useOrders(address);

	const loadOrdersWrapper = async () => {
		await loadOrders();
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
		{ id: "categories", label: "Categorías", icon: LayoutDashboard },
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
							{activeSection === "categories" && "Categorías"}
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

						{/* Categorías (placeholder) */}
						{activeSection === "categories" && (
							<div className="p-8 text-center text-muted-foreground">
								<LayoutDashboard className="h-16 w-16 mx-auto mb-4 opacity-30" />
								<p>Administrador de categorías próximamente...</p>
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
