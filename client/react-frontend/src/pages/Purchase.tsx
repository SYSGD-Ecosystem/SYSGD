// src/pages/Purchase.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Importar el componente React que creamos
import CryptoPurchase from '@/components/billing/CryptoPurchase';

const Purchase: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header con botón de volver */}
      <div className="border-b">
        <div className="container max-w-7xl mx-auto p-4">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>

      {/* Componente principal */}
      <CryptoPurchase />
    </div>
  );
};

export default Purchase;