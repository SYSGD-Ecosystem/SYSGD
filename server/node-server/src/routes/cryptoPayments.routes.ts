import { Router } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";
import { createCryptoPaymentService } from "../services/cryptoPayment.service";
import { getBlockchainListener } from "../services/blockchainListener.service";

const router = Router();

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// Determinar qué red usar según el entorno
const NETWORK = process.env.CRYPTO_NETWORK || "sepolia";
const cryptoService = createCryptoPaymentService(NETWORK as any);

// ============================================
// INFORMACIÓN GENERAL
// ============================================

/**
 * Obtiene información de la red blockchain
 */
router.get("/network", async (req, res) => {
  try {
    const networkInfo = await cryptoService.getNetworkInfo();
    res.json(networkInfo);
  } catch (error) {
    console.error("Error obteniendo info de red:", error);
    res.status(500).json({ error: "Error al obtener información de la red" });
  }
});

/**
 * Obtiene el estado del servicio de blockchain
 */
router.get("/service/status", async (req, res) => {
  try {
    const listener = getBlockchainListener();
    if (!listener) {
      res.status(503).json({ error: "Servicio no inicializado" });
      return;
    }

    const status = listener.getStatus();
    res.json(status);
  } catch (error) {
    console.error("Error obteniendo estado del servicio:", error);
    res.status(500).json({ error: "Error al obtener estado del servicio" });
  }
});

/**
 * Obtiene todos los productos/planes disponibles
 */
router.get("/products", async (req, res) => {
  try {
    const products = await cryptoService.getProducts();
    res.json(products);
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

/**
 * Obtiene información de un producto específico
 */
router.get("/products/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await cryptoService.getProduct(productId);
    
    if (!product) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error("Error obteniendo producto:", error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// ============================================
// BALANCE Y WALLET
// ============================================

/**
 * Obtiene el balance de USDT de una wallet
 */
router.get("/balance/:address", async (req, res) => {
  const { address } = req.params;

  try {
    const balance = await cryptoService.getUSDTBalance(address);
    res.json({ address, balance, currency: "USDT" });
  } catch (error) {
    console.error("Error obteniendo balance:", error);
    res.status(500).json({ error: "Error al obtener balance" });
  }
});

/**
 * Verifica el allowance de una wallet
 */
router.get("/allowance/:address", async (req, res) => {
  const { address } = req.params;

  try {
    const allowance = await cryptoService.checkAllowance(address);
    res.json({ address, allowance, currency: "USDT" });
  } catch (error) {
    console.error("Error verificando allowance:", error);
    res.status(500).json({ error: "Error al verificar allowance" });
  }
});

/**
 * Verifica el cooldown del faucet (solo testnet)
 */
router.get("/faucet/cooldown/:address", async (req, res) => {
  const { address } = req.params;

  if (NETWORK === "bsc" || NETWORK === "mainnet") {
    res.status(400).json({ error: "Faucet solo disponible en testnet" });
    return;
  }

  try {
    const cooldown = await cryptoService.getFaucetCooldown(address);
    res.json({ 
      address, 
      cooldownSeconds: cooldown,
      canRequest: cooldown === 0
    });
  } catch (error) {
    console.error("Error verificando cooldown:", error);
    res.status(500).json({ error: "Error al verificar cooldown" });
  }
});

// ============================================
// ÓRDENES DE PAGO
// ============================================

/**
 * Crea una nueva orden de pago
 */
router.post("/orders", async (req, res) => {
  const user = getCurrentUserData(req);
  const { productId, walletAddress } = req.body;

  if (!productId || !walletAddress) {
    res.status(400).json({ error: "productId y walletAddress son requeridos" });
    return;
  }

  try {
    // Crear orden en el servicio crypto
    const order = await cryptoService.createPaymentOrder(
      user!.id,
      walletAddress,
      productId
    );

    // Guardar orden en la base de datos
    const { rows } = await pool.query(
      `INSERT INTO crypto_payment_orders 
       (order_id, user_id, wallet_address, product_id, amount, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        order.orderId,
        order.userId,
        order.userWallet,
        order.productId,
        order.amount,
        order.status,
        order.createdAt
      ]
    );

    // ✨ ACTIVAR POLLING TEMPORAL
    const listener = getBlockchainListener();
    if (listener) {
      listener.activateTemporaryPolling();
      console.log("🔄 Polling temporal activado para nueva orden");
    }

    res.status(201).json(rows[0]);
  } catch (error: any) {
    console.error("Error creando orden:", error);
    res.status(400).json({ 
      error: error.message || "Error al crear orden de pago" 
    });
  }
});

/**
 * Obtiene información de una orden
 */
router.get("/orders/:orderId", async (req, res) => {
  const user = getCurrentUserData(req);
  const { orderId } = req.params;

  try {
    // Obtener de la BD
    const { rows } = await pool.query(
      "SELECT * FROM crypto_payment_orders WHERE order_id = $1 AND user_id = $2",
      [orderId, user!.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Orden no encontrada" });
      return;
    }

    const order = rows[0];

    // Si está pendiente, verificar en blockchain
    if (order.status === "pending" || order.status === "processing") {
      const isProcessed = await cryptoService.verifyPayment(orderId);
      
      if (isProcessed) {
        // Actualizar estado en BD
        await pool.query(
          "UPDATE crypto_payment_orders SET status = $1, completed_at = NOW() WHERE order_id = $2",
          ["completed", orderId]
        );
        order.status = "completed";
        order.completed_at = new Date();

        // Procesar el pago (agregar créditos o actualizar plan)
        await processCompletedPayment(order);
      }
    }

    res.json(order);
  } catch (error) {
    console.error("Error obteniendo orden:", error);
    res.status(500).json({ error: "Error al obtener orden" });
  }
});

/**
 * Lista todas las órdenes del usuario
 */
router.get("/orders", async (req, res) => {
  const user = getCurrentUserData(req);
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM crypto_payment_orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [user!.id, limit, offset]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo órdenes:", error);
    res.status(500).json({ error: "Error al obtener órdenes" });
  }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Procesa un pago completado y otorga créditos o actualiza plan
 */
async function processCompletedPayment(order: any) {
  const { user_id, product_id, amount } = order;

  try {
    // Determinar qué hacer según el productId
    if (product_id.startsWith("credits_")) {
      // Es compra de créditos
      const credits = parseInt(product_id.split("_")[1]);
      
      await pool.query(
        `UPDATE users 
         SET user_data = jsonb_set(
           jsonb_set(
             user_data,
             '{billing,ai_task_credits}',
             to_jsonb(COALESCE((user_data->'billing'->>'ai_task_credits')::int, 0) + $1)
           ),
           '{billing,purchased_credits}',
           to_jsonb(COALESCE((user_data->'billing'->>'purchased_credits')::int, 0) + $1)
         )
         WHERE id = $2`,
        [credits, user_id]
      );

      console.log(`✅ Agregados ${credits} créditos al usuario ${user_id}`);
      
    } else if (product_id.startsWith("plan_")) {
      // Es compra de plan
      const [, tier, period] = product_id.split("_");
      
      // Calcular fecha de renovación
      const nextReset = new Date();
      if (period === "monthly") {
        nextReset.setMonth(nextReset.getMonth() + 1);
      } else if (period === "yearly") {
        nextReset.setFullYear(nextReset.getFullYear() + 1);
      }

      // Determinar créditos iniciales según tier
      const initialCredits = tier === "pro" ? 100 : 500;

      await pool.query(
        `UPDATE users 
         SET user_data = jsonb_set(
           jsonb_set(
             jsonb_set(
               user_data,
               '{billing,tier}',
               $1
             ),
             '{billing,ai_task_credits}',
             to_jsonb($2)
           ),
           '{billing,billing_cycle,next_reset}',
           to_jsonb($3)
         )
         WHERE id = $4`,
        [JSON.stringify(tier), initialCredits, nextReset.toISOString(), user_id]
      );

      console.log(`✅ Plan ${tier} activado para usuario ${user_id}`);
    }

  } catch (error) {
    console.error("Error procesando pago completado:", error);
    throw error;
  }
}

export default router;