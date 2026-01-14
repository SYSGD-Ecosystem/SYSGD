import { Card } from "@/components/ui/card"
import { Code2, Server, Database, Smartphone, Layout, Lock } from "lucide-react"

const techCategories = [
  {
    icon: Layout,
    title: "Frontend",
    technologies: ["React 18", "TypeScript", "TailwindCSS", "Vite", "React Router"],
  },
  {
    icon: Server,
    title: "Backend",
    technologies: ["Node.js", "Express", "RESTful API", "JWT Auth", "Bcrypt"],
  },
  {
    icon: Database,
    title: "Base de Datos",
    technologies: ["PostgreSQL", "JSONB", "Prisma ORM", "Redis Cache"],
  },
  {
    icon: Smartphone,
    title: "Multiplataforma",
    technologies: ["Electron", "Progressive Web App", "Responsive Design"],
  },
  {
    icon: Code2,
    title: "Blockchain",
    technologies: ["Smart Contracts", "Web3 Integration", "Crypto Payments"],
  },
  {
    icon: Lock,
    title: "Seguridad",
    technologies: ["HTTPS", "CORS", "Rate Limiting", "SQL Injection Protection", "XSS Prevention"],
  },
]

export function TechStackSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stack Tecnológico</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Construido con las tecnologías más modernas y confiables del ecosistema JavaScript
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {techCategories.map((category) => (
            <Card key={category.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{category.title}</h3>
              </div>
              <ul className="space-y-2">
                {category.technologies.map((tech) => (
                  <li key={tech} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {tech}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="inline-block p-6 bg-muted">
            <p className="text-sm text-muted-foreground">
              <strong>Monorepo completo:</strong> Frontend React, Backend Node.js, App Electron, Contratos Blockchain,
              todo en un repositorio unificado
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
