import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Beta Pública · Código Abierto
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Sistema de Gestión Empresarial{" "}
            <span className="text-primary">Modular</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty leading-relaxed">
            Ecosistema modular de código abierto para la productividad
            empresarial. Gestión documental, proyectos, comunicación en equipo
            con IA integrada y más. Ya disponible en beta pública.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg">
              <a
                href="https://app.ecosysgd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-1"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Probar Ahora</span>
              </a>
            </Button>

            <Button size="lg" variant="outline">
              <ArrowRight className="ml-2 h-4 w-4" />
              <Link to="/plans">Ver Planes</Link>
            </Button>

            <Button size="lg" variant="outline">
              <a
                href="https://github.com/SYSGD-Ecosystem"
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-1"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            ⚠️ Versión beta: Pueden presentarse errores o comportamientos
            inesperados
          </p>
        </div>
      </div>
    </section>
  );
}
