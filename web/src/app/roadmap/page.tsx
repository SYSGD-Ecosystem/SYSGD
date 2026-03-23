import { ModuleCard } from "@/components/module-card"
import { modules } from "@/data/modules"

export default function RoadmapPage() {
  return (
    
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Roadmap del Proyecto</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Nuestra hoja de ruta muestra los módulos y funcionalidades planeadas para SYSGD Ecosystem. Sigue el
              progreso de cada componente del sistema.
            </p>
          </div>

          <div className="grid gap-6 md:gap-8 max-w-4xl mx-auto">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </div>
     </div>
  )
}
