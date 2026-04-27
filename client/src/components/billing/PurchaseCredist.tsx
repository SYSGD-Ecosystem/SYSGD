// src/components/billing/PurchaseCredits.tsx
import { FC, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import api from "@/lib/api";
import ProductCard, { Product } from "./components/ProductCard";

const normalizePrice = (price: string | number) => {
  const value = Number(price);
  if (!Number.isFinite(value)) return String(price);
  const display = value >= 100000 ? value / 1_000_000 : value;
  return display.toFixed(2);
};

const PurchaseCredits: FC<{
  onPurchaseStart: (product: Product) => void;
  isConnected: boolean;
}> = ({ onPurchaseStart, isConnected }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.get<Product[]>("/api/crypto-payments/products");
        const creditProducts = response.data
          .filter((p) => p.productId.startsWith("credits_") && p.active)
          .map((p) => ({ ...p, price: normalizePrice(p.price) }));
        setProducts(creditProducts);
      } catch (err) {
        setError("No se pudieron cargar los paquetes de créditos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Cargando paquetes...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (products.length === 0) {
    return <p className="text-center text-muted-foreground">No hay paquetes disponibles</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Comprar Créditos</h2>
        <p className="text-muted-foreground">
          Elige el paquete que mejor se adapte a tus necesidades y usos
        </p>
      </div>

      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Conecta tu wallet para poder realizar compras
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, idx) => (
          <ProductCard
            key={product.productId}
            product={product}
            featured={idx === 2} // Destaca el tercero como en el original
            onSelect={onPurchaseStart}
            disabled={!isConnected}
          />
        ))}
      </div>
    </div>
  );
};

export default PurchaseCredits;
