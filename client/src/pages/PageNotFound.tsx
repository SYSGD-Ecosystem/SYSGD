import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { FC } from "react";

const PageNotFound: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-6 relative">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-12 h-12 text-red-400 animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge variant="destructive" className="animate-pulse">
                  404
                </Badge>
              </div>
            </div>

            <CardTitle className="text-3xl font-bold text-white mb-2">
              ¡Oops! Parece que estás perdido
            </CardTitle>

            <p className="text-xl text-red-400 mb-4">Page Not Found</p>

            <p className="text-slate-400 max-w-md mx-auto">
              Estás intentando acceder a una página que no existe en nuestra plataforma, por favor, verifica la URL en el navegador.
            </p>

            <div className="mt-8 flex gap-4 justify-center">
              <Button asChild>
                <a href="/">Volver al Inicio</a>
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Página Anterior
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default PageNotFound;