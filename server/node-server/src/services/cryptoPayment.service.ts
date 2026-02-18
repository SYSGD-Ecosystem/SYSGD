import { ethers } from "ethers";
import { randomUUID } from "crypto";

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
	"function processPayment(string memory _productId, string memory _orderId) external",
	"function getProduct(string memory _productId) view returns (string memory productId, uint256 price, bool active, string memory description)",
	"function getAllProducts() view returns (string[] memory)",
	"function getPayment(string memory _orderId) view returns (address user, string memory productId, uint256 amount, uint256 timestamp)",
	"function isOrderProcessed(string memory _orderId) view returns (bool)",
	"function getUserPayments(address _user, uint256 _limit) view returns (string[] memory)",
	"event PaymentProcessed(address indexed user, string indexed orderId, string productId, uint256 amount, uint256 timestamp)",
];

let productsCache: Product[] | null = null;
let productsCacheTime = 0;
const PRODUCTS_TTL = 60_000; // 1 minuto


interface CryptoConfig {
	rpcUrl: string;
	chainId: number;
	testUsdtAddress: string;
	paymentGatewayAddress: string;
}

interface Product {
	productId: string;
	price: string; // En USDT (ej: "10.50")
	active: boolean;
	description: string;
}

interface PaymentOrder {
	orderId: string;
	productId: string;
	userId: string;
	userWallet: string;
	amount: string;
	status: "pending" | "processing" | "completed" | "failed";
	txHash?: string;
	createdAt: Date;
	completedAt?: Date;
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
	// async getProducts(): Promise<Product[]> {
	//   try {
	//     const productIds = await this.paymentGatewayContract.getAllProducts();
	//     const products: Product[] = [];

	//     for (const productId of productIds) {
	//       const product = await this.paymentGatewayContract.getProduct(productId);
	//       products.push({
	//         productId: product.productId,
	//         price: ethers.formatUnits(product.price, 6),
	//         active: product.active,
	//         description: product.description
	//       });
	//     }

	//     return products;
	//   } catch (error) {
	//     console.error("Error obteniendo productos:", error);
	//     throw new Error("Error al obtener productos");
	//   }
	// }

	async getProducts(): Promise<Product[]> {
		try {
			// Cache hit
			if (productsCache && Date.now() - productsCacheTime < PRODUCTS_TTL) {
				return productsCache;
			}

			const productIds: string[] =
				await this.paymentGatewayContract.getAllProducts();
			const products: Product[] = [];

			for (const productId of productIds) {
				const product = await this.paymentGatewayContract.getProduct(productId);

				products.push({
					productId: product.productId,
					price: ethers.formatUnits(product.price, 6),
					active: product.active,
					description: product.description,
				});
			}

			productsCache = products;
			productsCacheTime = Date.now();

			return products;
		} catch (error) {
			console.error("Error obteniendo productos:", error);
			throw new Error("Error al obtener productos");
		}
	}

	/**
	 * Obtiene información de un producto específico
	 */
	async getProduct(productId: string): Promise<Product | null> {
		try {
			const product = await this.paymentGatewayContract.getProduct(productId);

			if (!product.productId) {
				return null;
			}

			return {
				productId: product.productId,
				price: ethers.formatUnits(product.price, 6),
				active: product.active,
				description: product.description,
			};
		} catch (error) {
			console.error("Error obteniendo producto:", error);
			return null;
		}
	}

	/**
	 * Crea una orden de pago
	 */
	async createPaymentOrder(
		userId: string,
		userWallet: string,
		productId: string,
	): Promise<PaymentOrder> {
		try {
			// Verificar que el producto existe
			const product = await this.getProduct(productId);
			if (!product) {
				throw new Error("Producto no encontrado");
			}

			if (!product.active) {
				throw new Error("Producto no disponible");
			}

			// Verificar que el usuario tiene suficiente balance
			const balance = await this.getUSDTBalance(userWallet);
			if (parseFloat(balance) < parseFloat(product.price)) {
				throw new Error("Balance insuficiente de USDT");
			}

			console.log("User Balance:", balance);

			// Verificar allowance
			const allowance = await this.checkAllowance(userWallet);
			console.log("User Allowance:", allowance);
			if (parseFloat(allowance) < parseFloat(product.price)) {
				throw new Error("Debes aprobar el gasto de USDT primero");
			}

			// Generar orderId único
			const orderId = `ORDER_${Date.now()}_${randomUUID()}`;

			const order: PaymentOrder = {
				orderId,
				productId,
				userId,
				userWallet,
				amount: product.price,
				status: "pending",
				createdAt: new Date(),
			};

			return order;
		} catch (error) {
			console.error("Error creando orden:", error);
			throw error;
		}
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
					amount: ethers.formatUnits(amount, 6),
					timestamp: Number(timestamp) * 1000,
					txHash: event.log.transactionHash,
					blockNumber: event.log.blockNumber,
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
