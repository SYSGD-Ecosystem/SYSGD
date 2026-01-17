import { Card } from "@/components/ui/card"
import { Database, Lock, Palette, Blocks, Zap, Code } from "lucide-react"

const features = [
  {
    icon: Database,
    title: "PostgreSQL + JSONB",
    description: "Base de datos robusta con campos flexibles para estructuras documentales dinámicas.",
  },
  {
    icon: Code,
    title: "Stack Completo",
    description: "React + TypeScript frontend, Node.js + Express backend, aplicación de escritorio con Electron.",
  },
  {
    icon: Lock,
    title: "Seguridad Avanzada",
    description: "Autenticación robusta, JWT, cifrado con bcrypt, control de acceso por roles y permisos granulares.",
  },
  {
    icon: Palette,
    title: "Interfaz Moderna",
    description:
      "UI desarrollada con React, TypeScript, TailwindCSS y componentes personalizados para experiencia premium.",
  },
  {
    icon: Blocks,
    title: "API RESTful",
    description: "Backend modular en Node.js + Express con arquitectura escalable y documentación completa.",
  },
  {
    icon: Zap,
    title: "Blockchain Ready",
    description:
      "Infraestructura preparada para integración con contratos inteligentes y aplicaciones descentralizadas.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Características Principales</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Tecnologías modernas y arquitectura escalable para empresas
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
