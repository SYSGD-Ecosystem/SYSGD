// src/components/billing/components/ProductCard.tsx
import { FC } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";

export interface Product {
  productId: string;
  price: string;
  description: string;
  active: boolean;
}

interface ProductCardProps {
  product: Product;
  featured?: boolean;
  onSelect: (product: Product) => void;
  disabled?: boolean;
}

const ProductCard: FC<ProductCardProps> = ({
  product,
  featured = false,
  onSelect,
  disabled = false,
}) => {
  const isCredit = product.productId.startsWith("credits_");
  const isPlan = product.productId.startsWith("plan_");
  const normalizedDescription = product.description.replace("AI Credits", "Credits");

  const credits = isCredit ? product.productId.split("_")[1] : null;
  const [, tier, period] = isPlan ? product.productId.split("_") : ["", "", ""];

  return (
    <Card className={`relative transition-shadow hover:shadow-lg ${featured ? "border-primary shadow-lg" : ""}`}>
      {featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Más Popular
        </Badge>
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {isCredit && `${credits} Créditos`}
            {isPlan && (
              <>
                {tier === "pro" ? (
                  <Zap className="inline h-5 w-5 mr-1 text-yellow-500" />
                ) : (
                  <Star className="inline h-5 w-5 mr-1 fill-yellow-500 text-yellow-500" />
                )}
                {tier.toUpperCase()} {period === "monthly" ? "Mensual" : "Anual"}
              </>
            )}
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold">${product.price}</div>
            <div className="text-xs text-muted-foreground">USDT</div>
          </div>
        </div>
        <CardDescription>{normalizedDescription}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm">
          {isCredit && (
            <>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>{credits} créditos disponibles</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Uso flexible en distintos servicios</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Sin expiración</span>
              </div>
            </>
          )}

          {isPlan && (
            <>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Proyectos ilimitados</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Documentos ilimitados</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Integración GitHub</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>
                  {tier === "pro" ? "100" : "500"} créditos incluidos/
                  {period === "monthly" ? "mes" : "año"}
                </span>
              </div>
              {tier === "vip" && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Soporte prioritario</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onSelect(product)}
          disabled={disabled}
        >
          Comprar con USDT
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
