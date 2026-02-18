import { Button } from "@/components/ui/button"
import { ArrowRight, Github } from "lucide-react"

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
            Sistema de Gestión Empresarial <span className="text-primary">Modular</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty leading-relaxed">
            Ecosistema modular de código abierto para la productividad empresarial. Gestión documental, proyectos,
            comunicación en equipo con IA integrada y más. Ya disponible en beta pública.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="outline" asChild>
              <a href="https://work.ecosysgd.com" target="_blank" rel="noopener noreferrer">
                Ir a Work
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://cont.ecosysgd.com" target="_blank" rel="noopener noreferrer">
                Ir a Cont
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com/SYSGD-Ecosystem" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 text-left">
            <a href="https://work.ecosysgd.com" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-blue-200 bg-white/70 p-3 hover:bg-blue-50 transition-colors">
              <p className="text-sm font-semibold text-blue-800">Work</p>
              <p className="text-xs text-muted-foreground mt-1">Gestión de proyectos, tareas y colaboración.</p>
            </a>
            <a href="https://cont.ecosysgd.com" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-green-200 bg-white/70 p-3 hover:bg-green-50 transition-colors">
              <p className="text-sm font-semibold text-green-800">Cont</p>
              <p className="text-xs text-muted-foreground mt-1">Registro de ingresos y gastos para TCP.</p>
            </a>
            <a href="/updates" className="rounded-lg border border-amber-200 bg-white/70 p-3 hover:bg-amber-50 transition-colors">
              <p className="text-sm font-semibold text-amber-800">Institucional</p>
              <p className="text-xs text-muted-foreground mt-1">Novedades, estado del proyecto y comunidad.</p>
            </a>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            ⚠️ Versión beta: Pueden presentarse errores o comportamientos inesperados
          </p>
        </div>
      </div>
    </section>
  )
}
