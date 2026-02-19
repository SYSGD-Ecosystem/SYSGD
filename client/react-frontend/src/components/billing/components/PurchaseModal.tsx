import { FC, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useWeb3 } from "../hooks/useWeb3";
import type { Product } from "./ProductCard";

const EXPLORER_URL = "https://sepolia.etherscan.io/tx/"; // Cambiar a mainnet cuando corresponda

interface PurchaseModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  usdtBalance: string;
  isConnected: boolean;
  address: string | null;
  onPurchaseComplete?: () => Promise<void>; // Para recargar órdenes, balance, etc.
}

const PurchaseModal: FC<PurchaseModalProps> = ({
  product,
  isOpen,
  onClose,
  usdtBalance,
  isConnected,
  address,
  onPurchaseComplete,
}) => {
  const [step, setStep] = useState<"approve" | "pay" | "complete">("approve");
  const [processing, setProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();

  const usdtAddress = "0xbf1d573d4ce347b7ba0f198028cca36df7aeaf9b";
  const paymentGatewayAddress = "0x484cad0b7237dfda563f976ce54a53af1b515a5c";

  const { approveUSDT, processPayment } = useWeb3(
    usdtAddress,
    paymentGatewayAddress
  );

  // Resetear estado al cerrar o cambiar producto
  useEffect(() => {
    if (!isOpen || !product) {
      setStep("approve");
      setProcessing(false);
      setIsVerifying(false);
      setTxHash("");
    }
  }, [isOpen, product]);

  if (!isOpen || !product || !isConnected || !address) {
    return null;
  }

  const normalizedDescription = product.description.replace("AI Credits", "Credits");

  const price = parseFloat(product.price);
  const balance = parseFloat(usdtBalance);
  const hasEnoughBalance = balance >= price;

  const handleApprove = async () => {
    setProcessing(true);
    try {
      toast({
        title: "Confirmación lista",
        description: "En el siguiente paso se crea la orden y se solicita la aprobación exacta",
      });
      setStep("pay");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error en aprobación",
        description: error.message || "No se pudo aprobar el gasto de USDT",
      });
    } finally {
      setProcessing(false);
    }
  };

  const verifyOrderCompletion = async (orderId: string): Promise<boolean> => {
    const maxAttempts = 25;
    const interval = 3000;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await api.get(`/api/crypto-payments/orders/${orderId}`);
        const order = response.data;

        if (order.status === "completed") {
          return true;
        }
        if (order.status === "failed" || order.status === "expired") {
          return false;
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (err) {
        console.error("Error polling order:", err);
      }
    }
    return false;
  };

  const handlePay = async () => {
    setProcessing(true);

    try {
      // 1. Crear orden en el backend
      const orderResponse = await api.post("/api/crypto-payments/orders", {
        productId: product.productId,
        walletAddress: address,
      });

      const order = orderResponse.data;

      // 2. Aprobar monto exacto de la orden
      await approveUSDT(order.amount);

      // 3. Ejecutar pago en blockchain
      const hash = await processPayment(product.productId, order.orderId, order.amount);

      setTxHash(hash);
      setProcessing(false);
      setIsVerifying(true);

      toast({
        title: "Transacción enviada",
        description: "Esperando confirmación en blockchain...",
      });

      // 3. Verificar confirmación
      const completed = await verifyOrderCompletion(order.orderId);

      setIsVerifying(false);

      if (completed) {
        toast({
          title: "¡Compra exitosa!",
          description: "Tus créditos o plan han sido activados",
        });
        setStep("complete");
        onPurchaseComplete?.();
      } else {
        toast({
          variant: "destructive",
          title: "Tiempo agotado",
          description:
            "La transacción puede tardar unos minutos. Puedes verificar más tarde en el historial.",
        });
        setStep("complete"); // Mostrar tx de todos modos
      }
    } catch (error: any) {
      setIsVerifying(false);
      setProcessing(false);

      const message =
        error.response?.data?.error ||
        error.message ||
        "Error al procesar el pago";

      toast({
        variant: "destructive",
        title: "Error en el pago",
        description: message,
      });
    }
  };

  const copyHash = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressValue = step === "approve" ? 33 : step === "pay" ? 66 : 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Proceso de Compra
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardTitle>
          <CardDescription>{normalizedDescription}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Paso {step === "approve" ? 1 : step === "pay" ? 2 : 3} de 3</span>
              <span className="text-muted-foreground">
                {step === "approve" && "Aprobar USDT"}
                {step === "pay" && "Confirmar pago"}
                {step === "complete" && "Completado"}
              </span>
            </div>
            <Progress value={progressValue} />
          </div>

          {/* Resumen del producto */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Producto</span>
              <span className="font-medium">{product.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Precio</span>
              <span className="font-bold text-lg">${product.price} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tu balance</span>
              <span className={hasEnoughBalance ? "text-green-600" : "text-red-600"}>
                ${usdtBalance} USDT
              </span>
            </div>
          </div>

          {/* Paso: Aprobar */}
          {step === "approve" && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Debes aprobar que el contrato gaste tus USDT. Es una operación segura y estándar.
                </AlertDescription>
              </Alert>

              <Button
                size="lg"
                className="w-full"
                onClick={handleApprove}
                disabled={processing || !hasEnoughBalance}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Aprobar {product.price} USDT
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Paso: Pagar */}
          {step === "pay" && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  ¡USDT aprobado! Ahora confirma el pago final.
                </AlertDescription>
              </Alert>

              <Button
                size="lg"
                className="w-full"
                onClick={handlePay}
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
                    Esto puede tomar 1-3 minutos dependiendo de la red.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Paso: Completado */}
          {step === "complete" && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-20 w-20 text-green-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-2">¡Compra Exitosa!</h3>
                <p className="text-muted-foreground">
                  {txHash
                    ? "Tu transacción ha sido procesada correctamente."
                    : "El pago está siendo confirmado. Puedes verificar el estado en tu historial."}
                </p>
              </div>

              {txHash && (
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground">Hash de transacción</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs truncate bg-background px-3 py-2 rounded">
                      {txHash}
                    </code>
                    <Button size="sm" variant="ghost" onClick={copyHash}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(EXPLORER_URL + txHash, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button size="lg" className="w-full" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseModal;
