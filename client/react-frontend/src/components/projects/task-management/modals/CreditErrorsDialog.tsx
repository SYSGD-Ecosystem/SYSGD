import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CreditCard,
  Key,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { GeminiError } from '../hooks/useTaskAIAgent';

interface CreditsErrorDialogProps {
  open: boolean;
  onClose: () => void;
  error: GeminiError | null;
  onRetry?: () => void;
}

export const CreditsErrorDialog: React.FC<CreditsErrorDialogProps> = ({
  open,
  onClose,
  error,
  onRetry,
}) => {
  const navigate = useNavigate();

  if (!error) return null;

  const handlePurchase = () => {
    onClose();
    navigate('/billing/purchase');
  };

  const handleConfigureToken = () => {
    onClose();
    navigate('/settings/tokens');
  };

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  // Contenido específico según el tipo de error
  const renderErrorContent = () => {
    switch (error.type) {
      case 'no_credits':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                Te has quedado sin créditos
              </DialogTitle>
              <DialogDescription className="text-center">
                {error.message}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Los créditos te permiten usar funciones de la plataforma como asistentes,
                  generación de contenido y otros servicios.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3">
                {error.actionRequired === 'configure_token' ? (
                  <>
                    <Button 
                      onClick={handleConfigureToken}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Key className="h-4 w-4" />
                      Configurar mi propio token
                    </Button>
                    <Button 
                      onClick={handlePurchase}
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                    >
                      <CreditCard className="h-4 w-4" />
                      Comprar créditos
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={handlePurchase}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <CreditCard className="h-4 w-4" />
                      Comprar más créditos
                    </Button>
                    <Button 
                      onClick={handleConfigureToken}
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Key className="h-4 w-4" />
                      Usar mi propio token
                    </Button>
                  </>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  ¿Necesitas más? Actualiza a un plan superior para obtener créditos ilimitados
                </p>
                <Button
                  variant="link"
                  className="w-full gap-1 text-primary"
                  onClick={() => {
                    onClose();
                    navigate('/billing/upgrade');
                  }}
                >
                  <TrendingUp className="h-3 w-3" />
                  Ver planes disponibles
                </Button>
              </div>
            </div>
          </>
        );

      case 'unauthorized':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                Sesión expirada
              </DialogTitle>
              <DialogDescription className="text-center">
                {error.message}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={handleLogin} className="w-full">
                Iniciar sesión
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full">
                Cancelar
              </Button>
            </DialogFooter>
          </>
        );

      case 'rate_limit':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                  <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                Demasiadas peticiones
              </DialogTitle>
              <DialogDescription className="text-center">
                {error.message}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {onRetry && (
                <Button onClick={onRetry} className="w-full">
                  Reintentar
                </Button>
              )}
              <Button onClick={onClose} variant="outline" className="w-full">
                Entendido
              </Button>
            </DialogFooter>
          </>
        );

      case 'network':
      case 'server':
      case 'unknown':
      default:
        return (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                {error.type === 'network' ? 'Error de conexión' : 
                 error.type === 'server' ? 'Error del servidor' : 
                 'Error inesperado'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {error.message}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {error.canRetry && onRetry && (
                <Button onClick={onRetry} className="w-full">
                  Reintentar
                </Button>
              )}
              <Button onClick={onClose} variant="outline" className="w-full">
                Cerrar
              </Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {renderErrorContent()}
      </DialogContent>
    </Dialog>
  );
};
