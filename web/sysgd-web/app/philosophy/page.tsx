import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Code, Users, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PhilosophyPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Nuestra Filosofía</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Los principios y valores que guían el desarrollo de SYSGD Ecosystem.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg leading-relaxed text-muted-foreground">
                SYSGD Ecosystem nació con la visión de crear herramientas empresariales que realmente funcionen para las
                organizaciones, sin las complejidades innecesarias de sistemas tradicionales. Creemos en el software que
                se adapta a las personas, no al revés.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Código Abierto</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      SYSGD es código abierto bajo licencia GNU AGPL v3.0. El repositorio es público y cualquiera puede
                      acceder al código fuente, contribuir al proyecto o adaptarlo a sus necesidades. Creemos en la
                      transparencia y la colaboración comunitaria.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Simplicidad</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Una interfaz intuitiva y moderna es nuestra prioridad. Las herramientas empresariales no tienen
                      por qué ser complicadas. Diseñamos para que cualquier usuario pueda comenzar sin curva de
                      aprendizaje.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Modularidad</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Cada organización es diferente. Por eso construimos un ecosistema modular donde puedes activar
                      solo lo que necesitas: gestión documental, proyectos, comunicación en equipo con IA y más.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Seguridad</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Los datos empresariales son críticos. Implementamos autenticación robusta, cifrado de contraseñas,
                      control de acceso por roles y las mejores prácticas de seguridad.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-8 md:p-12 bg-primary text-primary-foreground">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">Únete a SYSGD</h2>
                <p className="text-lg leading-relaxed opacity-90 mb-6">
                  SYSGD está disponible en beta pública. Pruébalo gratis, explora el código fuente en GitHub, o contacta
                  para soluciones empresariales personalizadas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" asChild>
                    <a href="https://app.ecosysgd.com" target="_blank" rel="noopener noreferrer">
                      Probar Ahora
                    </a>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <a href="https://github.com/SYSGD-Ecosystem" target="_blank" rel="noopener noreferrer">
                      Ver en GitHub
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
