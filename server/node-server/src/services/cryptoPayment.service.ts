import { ethers } from "ethers";
import { pool } from "../db";
import { PRODUCTS, type ProductId } from "../constants/plans";

// ABIs de los contratos
const TESTUSDT_ABI = [
	"function balanceOf(address account) view returns (uint256)",
	"function decimals() view returns (uint8)",
	"function approve(address spender, uint256 amount) returns (bool)",
	"function allowance(address owner, address spender) view returns (uint256)",
	"function requestTokens() external",
	"function timeUntilNextFaucet(address user) view returns (uint256)",
	"event Transfer(address indexed from, address indexed to, uint256 value)",
];

const PAYMENT_GATEWAY_ABI = [
	"function processPayment(string memory _productId, string memory _orderId, uint256 _amount) external",
	"function getPayment(string memory _orderId) view returns (address user, string memory productId, uint256 amount, uint256 timestamp)",
	"function isOrderProcessed(string memory _orderId) view returns (bool)",
	"function getUserPayments(address _user, uint256 _limit) view returns (string[] memory)",
	"event PaymentProcessed(address indexed user, string indexed orderId, string productId, uint256 amount, uint256 timestamp)",
];

interface CryptoConfig {
	rpcUrl: string;
	chainId: number;
	testUsdtAddress: string;
	paymentGatewayAddress: string;
}

interface Product {
	productId: string;
	price: number; // En micro USDT (6 decimales)
	active: boolean;
	description: string;
}

export class CryptoPaymentService {
	private provider: ethers.JsonRpcProvider;
	private testUsdtContract: ethers.Contract;
	private paymentGatewayContract: ethers.Contract;
	private config: CryptoConfig;

	constructor(config: CryptoConfig) {
		this.config = config;
		this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

		// Contratos en modo read-only
		this.testUsdtContract = new ethers.Contract(
			config.testUsdtAddress,
			TESTUSDT_ABI,
			this.provider,
		);

		this.paymentGatewayContract = new ethers.Contract(
			config.paymentGatewayAddress,
			PAYMENT_GATEWAY_ABI,
			this.provider,
		);
	}

	/**
	 * Obtiene el balance de USDT de una dirección
	 */
	async getUSDTBalance(address: string): Promise<string> {
		try {
			const balance = await this.testUsdtContract.balanceOf(address);
			return ethers.formatUnits(balance, 6); // USDT tiene 6 decimales
		} catch (error) {
			console.error("Error obteniendo balance:", error);
			throw new Error("Error al obtener balance de USDT");
		}
	}

	/**
	 * Verifica si una dirección tiene suficiente allowance
	 */
	async checkAllowance(userAddress: string): Promise<string> {
		try {
			const allowance = await this.testUsdtContract.allowance(
				userAddress,
				this.config.paymentGatewayAddress,
			);
			return ethers.formatUnits(allowance, 6);
		} catch (error) {
			console.error("Error verificando allowance:", error);
			throw new Error("Error al verificar allowance");
		}
	}

	/**
	 * Obtiene todos los productos disponibles
	 */
	async getProducts(): Promise<Product[]> {
		return Object.entries(PRODUCTS)
			.filter(([, product]) => product.active)
			.map(([productId, product]) => ({ productId, ...product }));
	}

	/**
	 * Obtiene información de un producto específico
	 */
	async getProduct(productId: string): Promise<Product | null> {
		const product = PRODUCTS[productId as ProductId];
		if (!product) return null;
		return { productId, ...product };
	}

	/**
	 * Crea una orden en base de datos
	 */
	async createOrder(productId: ProductId, userId: string, walletAddress: string) {
		const product = PRODUCTS[productId];
		if (!product || !product.active) throw new Error("Producto no válido");

		const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

		await pool.query(
			`INSERT INTO crypto_payment_orders
			 (order_id, user_id, wallet_address, product_id, amount, status)
			 VALUES ($1, $2, $3, $4, $5, 'pending')`,
			[orderId, userId, walletAddress, productId, product.price],
		);

		return { orderId, amount: product.price, productId };
	}

	/**
	 * Verifica si una orden fue procesada en el blockchain
	 */
	async verifyPayment(orderId: string): Promise<boolean> {
		try {
			return await this.paymentGatewayContract.isOrderProcessed(orderId);
		} catch (error) {
			console.error("Error verificando pago:", error);
			return false;
		}
	}

	/**
	 * Obtiene información de un pago procesado
	 */
	async getPaymentInfo(orderId: string): Promise<any> {
		try {
			const payment = await this.paymentGatewayContract.getPayment(orderId);

			return {
				user: payment.user,
				productId: payment.productId,
				amountRaw: payment.amount.toString(),
				amount: ethers.formatUnits(payment.amount, 6),
				timestamp: Number(payment.timestamp) * 1000, // Convertir a ms
			};
		} catch (error) {
			console.error("Error obteniendo info de pago:", error);
			return null;
		}
	}

	/**
	 * Obtiene el historial de pagos de un usuario
	 */
	async getUserPaymentHistory(
		userAddress: string,
		limit: number = 10,
	): Promise<string[]> {
		try {
			return await this.paymentGatewayContract.getUserPayments(
				userAddress,
				limit,
			);
		} catch (error) {
			console.error("Error obteniendo historial:", error);
			return [];
		}
	}

	/**
	 * Escucha eventos de pago en tiempo real
	 */
	listenForPayments(callback: (event: any) => void) {
		this.paymentGatewayContract.on(
			"PaymentProcessed",
			(user, orderId, productId, amount, timestamp, event) => {
				callback({
					user,
					orderId,
					productId,
					amount,
					timestamp: Number(timestamp) * 1000,
					txHash: event?.transactionHash ?? event?.log?.transactionHash,
					blockNumber: event?.blockNumber ?? event?.log?.blockNumber,
				});
			},
		);
	}

	/**
	 * Para de escuchar eventos
	 */
	stopListening() {
		this.paymentGatewayContract.removeAllListeners("PaymentProcessed");
	}

	/**
	 * Verifica el tiempo restante para usar el faucet
	 */
	async getFaucetCooldown(address: string): Promise<number> {
		try {
			const cooldown = await this.testUsdtContract.timeUntilNextFaucet(address);
			return Number(cooldown);
		} catch (error) {
			console.error("Error obteniendo cooldown del faucet:", error);
			return 0;
		}
	}

	/**
	 * Obtiene información de la red
	 */
	async getNetworkInfo() {
		try {
			const network = await this.provider.getNetwork();
			const blockNumber = await this.provider.getBlockNumber();

			return {
				chainId: Number(network.chainId),
				name: network.name,
				blockNumber,
				testUsdtAddress: this.config.testUsdtAddress,
				paymentGatewayAddress: this.config.paymentGatewayAddress,
			};
		} catch (error) {
			console.error("Error obteniendo info de red:", error);
			throw new Error("Error al obtener información de la red");
		}
	}
}

// Factory para crear instancias según la red
export function createCryptoPaymentService(
	network: "sepolia" | "bsc-testnet" | "bsc" | "mainnet",
): CryptoPaymentService {
	const configs: Record<string, CryptoConfig> = {
		sepolia: {
			rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
			chainId: 11155111,
			testUsdtAddress: process.env.TESTUSDT_CONTRACT_ADDRESS || "",
			paymentGatewayAddress: process.env.PAYMENT_GATEWAY_CONTRACT_ADDRESS || "",
		},
		"bsc-testnet": {
			rpcUrl:
				process.env.BSC_TESTNET_RPC_URL ||
				"https://data-seed-prebsc-1-s1.binance.org:8545",
			chainId: 97,
			testUsdtAddress: process.env.BSC_TESTNET_TESTUSDT_ADDRESS || "",
			paymentGatewayAddress:
				process.env.BSC_TESTNET_PAYMENT_GATEWAY_ADDRESS || "",
		},
		bsc: {
			rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
			chainId: 56,
			testUsdtAddress:
				process.env.BSC_USDT_ADDRESS ||
				"0x55d398326f99059fF775485246999027B3197955",
			paymentGatewayAddress: process.env.BSC_PAYMENT_GATEWAY_ADDRESS || "",
		},
		mainnet: {
			rpcUrl: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com",
			chainId: 1,
			testUsdtAddress:
				process.env.ETH_USDT_ADDRESS ||
				"0xdAC17F958D2ee523a2206206994597C13D831ec7",
			paymentGatewayAddress: process.env.ETH_PAYMENT_GATEWAY_ADDRESS || "",
		},
	};

	const config = configs[network];
	if (!config) {
		throw new Error(`Red no soportada: ${network}`);
	}

	return new CryptoPaymentService(config);
}
