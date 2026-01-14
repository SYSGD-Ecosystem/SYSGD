import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Mail, Phone, Code2, Building2 } from "lucide-react"

export function CollaborationSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Acceso al Código</h2>
            <p className="text-muted-foreground text-lg text-pretty">
              Información sobre cómo colaborar o implementar SYSGD en tu organización
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Para Colaboradores</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Si estás interesado en colaborar en el desarrollo de SYSGD, puedes contactar para solicitar acceso
                    al repositorio privado. Actualmente en fase de desarrollo activo.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Acceso al código fuente completo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Participación en decisiones técnicas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Crédito como colaborador oficial</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Para Empresas</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Si estás interesado en implementar SYSGD en tu organización, puedes contactar para obtener
                    información sobre acceso anticipado y soporte de implementación.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Acceso anticipado al sistema</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Soporte de implementación</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Personalización según necesidades</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-8 md:p-10 bg-primary text-primary-foreground">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-3">Estado del Proyecto</h3>
              <p className="text-lg leading-relaxed opacity-90 mb-6 max-w-2xl mx-auto">
                SYSGD es código abierto (GNU AGPL v3.0) y propiedad intelectual del equipo de desarrollo. Durante la
                fase de desarrollo, el repositorio permanece privado y accesible solo para el equipo, colaboradores y
                personas invitadas. El código será liberado públicamente cuando esté listo para producción.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <a href="mailto:lazaroyunier96@outlook.es">
                    <Mail className="mr-2 h-4 w-4" />
                    Contactar por Email
                  </a>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <a href="https://wa.me/5351158544" target="_blank" rel="noopener noreferrer">
                    <Phone className="mr-2 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10"
                  asChild
                >
                  <a href="https://github.com/SYSGD-Ecosystem" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
