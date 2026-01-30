import { Card } from "@/components/ui/card"
import { FileText, FolderKanban, MessageSquare } from "lucide-react"

const modules = [
  {
    icon: FileText,
    title: "Gestión Documental",
    description:
      "Sistema completo de entrada, salida y préstamo de documentos. Incluye Cuadro de Clasificación Documental y Tablas de Retención.",
    status: "Completado",
  },
  {
    icon: FolderKanban,
    title: "Gestión de Proyectos",
    description:
      "Gestión de usuarios, roles y asignación dinámica de tareas. Editor avanzado con Markdown y soporte para imágenes.",
    status: "En desarrollo",
  },
  {
    icon: MessageSquare,
    title: "Chat para Equipos",
    description:
      "Comunicación en tiempo real integrada con proyectos. Incluye soporte para agentes de inteligencia artificial.",
    status: "En desarrollo",
  },
]

export function ModulesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Módulos del Ecosistema</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Componentes configurables que se adaptan a las necesidades de tu organización
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {modules.map((module) => (
            <Card key={module.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <module.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">{module.title}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    module.status === "Completado"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  {module.status}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{module.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
