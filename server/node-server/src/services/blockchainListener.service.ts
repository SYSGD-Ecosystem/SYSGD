// src/services/blockchainListener.service.ts
import { CryptoPaymentService } from "./cryptoPayment.service";
import { pool } from "../db";

export class BlockchainListenerService {
  private cryptoService: CryptoPaymentService;
  private isListening: boolean = false;
  private activePolling: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastOrderTime: Date | null = null;
  private readonly POLLING_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly POLLING_INTERVAL = 10000; // 10 segundos

  constructor(cryptoService: CryptoPaymentService) {
    this.cryptoService = cryptoService;
  }

  /**
   * Inicia el listener de eventos de blockchain
   */
  start() {
    if (this.isListening) {
      console.log("⚠️  Listener ya está activo");
      return;
    }

    console.log("🎧 Iniciando listener de pagos blockchain...");
    this.isListening = true;

    // Escuchar eventos PaymentProcessed en tiempo real
    this.cryptoService.listenForPayments(async (event) => {
      console.log("💰 Pago detectado en blockchain:", event);
      
      try {
        await this.processPaymentEvent(event);
      } catch (error) {
        console.error("❌ Error procesando evento de pago:", error);
      }
    });

    console.log("✅ Listener de blockchain activo");
    console.log("ℹ️  Polling se activará solo cuando haya órdenes pendientes");
  }

  /**
   * Detiene el listener
   */
  stop() {
    if (!this.isListening) return;

    console.log("🛑 Deteniendo listener de blockchain...");
    this.cryptoService.stopListening();
    this.stopPolling();
    this.isListening = false;
  }

  /**
   * Activa el polling temporal cuando se crea una orden
   * Se llama desde el endpoint de crear orden
   */
  activateTemporaryPolling() {
    this.lastOrderTime = new Date();
    
    if (this.activePolling) {
      console.log("ℹ️  Polling ya está activo, extendiendo tiempo...");
      return;
    }

    console.log("🔄 Activando polling temporal por 5 minutos...");
    this.activePolling = true;
    
    // Iniciar polling
    this.pollingInterval = setInterval(async () => {
      await this.checkPendingOrders();
      
      // Verificar si debe detenerse el polling
      if (this.shouldStopPolling()) {
        this.stopPolling();
      }
    }, this.POLLING_INTERVAL);

    // Ejecutar inmediatamente la primera vez
    this.checkPendingOrders();
  }

  /**
   * Verifica si debe detener el polling
   */
  private shouldStopPolling(): boolean {
    if (!this.lastOrderTime) return true;
    
    const timeSinceLastOrder = Date.now() - this.lastOrderTime.getTime();
    return timeSinceLastOrder > this.POLLING_DURATION;
  }

  /**
   * Detiene el polling
   */
  private stopPolling() {
    if (!this.activePolling) return;
    
    console.log("⏸️  Deteniendo polling (no hay órdenes pendientes recientes)");
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.activePolling = false;
  }

  /**
   * Procesa un evento de pago desde blockchain
   */
  private async processPaymentEvent(event: any) {
    const { orderId, txHash, user, productId, amount, timestamp } = event;

    try {
      // Buscar la orden en la base de datos
      const { rows } = await pool.query(
        "SELECT * FROM crypto_payment_orders WHERE order_id = $1",
        [orderId]
      );

      if (rows.length === 0) {
        console.log(`⚠️  Orden ${orderId} no encontrada en BD`);
        return;
      }

      const order = rows[0];

      // Si ya está completada, no hacer nada
      if (order.status === "completed") {
        console.log(`✅ Orden ${orderId} ya estaba completada`);
        return;
      }

      // Actualizar orden en BD
      await pool.query(
        `UPDATE crypto_payment_orders 
         SET status = $1, tx_hash = $2, completed_at = NOW()
         WHERE order_id = $3`,
        ["completed", txHash, orderId]
      );

      console.log(`✅ Orden ${orderId} marcada como completada`);

      // Procesar el pago y dar créditos/plan al usuario
      await this.fulfillOrder(order);

      // Registrar en log de webhooks
      await pool.query(
        `INSERT INTO crypto_payment_webhooks 
         (order_id, event_type, tx_hash, block_number, payload, processed)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          "PaymentProcessed",
          txHash,
          event.blockNumber,
          JSON.stringify(event),
          true
        ]
      );

    } catch (error) {
      console.error(`❌ Error procesando orden ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Verifica solo las órdenes pendientes recientes
   */
  private async checkPendingOrders() {
    try {
      // Buscar solo órdenes de los últimos 10 minutos que estén pendientes
      const { rows } = await pool.query(
        `SELECT * FROM crypto_payment_orders 
         WHERE status IN ('pending', 'processing')
         AND created_at > NOW() - INTERVAL '10 minutes'
         AND created_at < NOW() - INTERVAL '30 seconds'
         ORDER BY created_at DESC
         LIMIT 20`
      );

      if (rows.length === 0) {
        console.log("ℹ️  No hay órdenes pendientes para verificar");
        return;
      }

      console.log(`🔍 Verificando ${rows.length} órdenes pendientes...`);

      for (const order of rows) {
        await this.checkAndUpdateOrder(order);
      }

      // Limpiar órdenes expiradas (solo cuando hay polling activo)
      await pool.query("SELECT cleanup_expired_orders()");

    } catch (error) {
      console.error("❌ Error en verificación de órdenes:", error);
    }
  }

  /**
   * Verifica y actualiza una orden pendiente
   */
  private async checkAndUpdateOrder(order: any) {
    try {
      const isProcessed = await this.cryptoService.verifyPayment(order.order_id);
      
      if (isProcessed && order.status !== "completed") {
        // Obtener info del pago
        const paymentInfo = await this.cryptoService.getPaymentInfo(order.order_id);
        
        // Actualizar orden
        await pool.query(
          `UPDATE crypto_payment_orders 
           SET status = $1, completed_at = NOW()
           WHERE order_id = $2`,
          ["completed", order.order_id]
        );

        console.log(`✅ Orden ${order.order_id} verificada y completada (polling)`);

        // Cumplir la orden
        await this.fulfillOrder(order);
      }
    } catch (error) {
      console.error(`❌ Error verificando orden ${order.order_id}:`, error);
    }
  }

  /**
   * Procesa una orden completada y otorga créditos o plan
   */
  private async fulfillOrder(order: any) {
    const { user_id, product_id, amount, order_id } = order;

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

        console.log(`✅ Agregados ${credits} créditos al usuario ${user_id} (Orden: ${order_id})`);
        
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

        console.log(`✅ Plan ${tier} activado para usuario ${user_id} (Orden: ${order_id})`);
      }

    } catch (error) {
      console.error("❌ Error cumpliendo orden:", error);
      throw error;
    }
  }

  /**
   * Obtiene el estado actual del servicio
   */
  getStatus() {
    return {
      isListening: this.isListening,
      activePolling: this.activePolling,
      lastOrderTime: this.lastOrderTime,
      pollingTimeRemaining: this.lastOrderTime 
        ? Math.max(0, this.POLLING_DURATION - (Date.now() - this.lastOrderTime.getTime()))
        : 0
    };
  }
}

// Singleton para mantener una única instancia
let listenerInstance: BlockchainListenerService | null = null;

export function createBlockchainListener(cryptoService: CryptoPaymentService) {
  if (!listenerInstance) {
    listenerInstance = new BlockchainListenerService(cryptoService);
  }
  return listenerInstance;
}

export function getBlockchainListener(): BlockchainListenerService | null {
  return listenerInstance;
}