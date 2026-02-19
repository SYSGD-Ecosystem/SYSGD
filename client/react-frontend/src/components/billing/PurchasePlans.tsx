// src/components/billing/PurchasePlans.tsx
import { FC, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import api from "@/lib/api";
import ProductCard, { Product } from "./components/ProductCard";

const normalizePrice = (price: string | number) => {
  const value = Number(price);
  if (!Number.isFinite(value)) return String(price);
  const display = value >= 100000 ? value / 1_000_000 : value;
  return display.toFixed(2);
};

const PurchasePlans: FC<{
  onPurchaseStart: (product: Product | null) => void;
  isConnected: boolean;
}> = ({ onPurchaseStart, isConnected }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await api.get<Product[]>("/api/crypto-payments/products");
        const planProducts = response.data
          .filter((p) => p.productId.startsWith("plan_") && p.active)
          .map((p) => ({ ...p, price: normalizePrice(p.price) }));
        setProducts(planProducts);
      } catch (err) {
        console.error("Error cargando planes:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) return <div className="text-center py-12">Cargando planes...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Planes de Suscripción</h2>
        <p className="text-muted-foreground">
          Acceso ilimitado + créditos mensuales/anuales
        </p>
      </div>

      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Conecta tu wallet para poder suscribirte
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {products.map((product) => (
          <ProductCard
            key={product.productId}
            product={product}
            featured={product.productId.includes("yearly")}
            onSelect={onPurchaseStart}
            disabled={!isConnected}
          />
        ))}
      </div>
    </div>
  );
};

export default PurchasePlans;
