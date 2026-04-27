// src/services/blockchainListener.service.ts
import { CryptoPaymentService } from "./cryptoPayment.service";
import { pool } from "../db";
import { handlePaymentEvent } from "./payment-fulfillment.service";

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
    const { orderId, txHash, productId, amount } = event;

    try {
      await handlePaymentEvent({
        orderId,
        productId,
        amount: BigInt(amount),
        txHash,
      });

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
          JSON.stringify({
            ...event,
            amount: String(amount),
          }),
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
        const paymentInfo = await this.cryptoService.getPaymentInfo(order.order_id);
        if (!paymentInfo) return;

        await handlePaymentEvent({
          orderId: order.order_id,
          productId: paymentInfo.productId,
          amount: BigInt(paymentInfo.amountRaw),
          txHash: order.tx_hash ?? "",
        });

        console.log(`✅ Orden ${order.order_id} verificada y procesada (polling)`);
      }
    } catch (error) {
      console.error(`❌ Error verificando orden ${order.order_id}:`, error);
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
