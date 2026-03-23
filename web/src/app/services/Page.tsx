import { Card } from "@/components/ui/card"
import { Code, Users, Rocket, Briefcase, Globe, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ServicesPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Desarrollo Web Profesional
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Transformamos tus ideas en soluciones digitales potentes. Desde pequeñas empresas hasta grandes corporaciones.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-12">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              En SYSGD Ecosystem contamos con una extensa red de colaboradores especializados en desarrollo web. 
              No importa el tamaño de tu empresa o la complejidad de tu proyecto, tenemos la experiencia y el 
              equipo necesario para hacer realidad tu visión digital. Esta es la plataforma de desarrollo que necesitas.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Para Pequeñas Empresas</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Sitios web profesionales, landing pages y tiendas online que se ajustan a tu presupuesto. 
                    Te ayudamos a establecer tu presencia digital sin complicaciones.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Para Grandes Empresas</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Sistemas empresariales complejos, plataformas escalables y soluciones a medida. 
                    Arquitecturas robustas diseñadas para crecer con tu negocio.
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
                  <h3 className="text-xl font-semibold mb-2">Red de Colaboradores</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Trabajamos con desarrolladores, diseñadores y especialistas de todo el mundo. 
                    Tu proyecto cuenta con un equipo experto y multidisciplinario.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Tecnología Moderna</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Utilizamos las últimas tecnologías: React, Next.js, Node.js, bases de datos escalables 
                    y arquitecturas cloud. Tu solución estará preparada para el futuro.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Desarrollo Ágil</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Metodologías ágiles que garantizan entregas rápidas y flexibilidad ante cambios. 
                    Verás resultados desde las primeras semanas.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Soporte Continuo</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    No terminamos con el lanzamiento. Ofrecemos mantenimiento, actualizaciones y soporte 
                    técnico para que tu proyecto siempre funcione perfectamente.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">
                Haz Realidad Tu Sueño Digital
              </h2>
              <p className="text-lg leading-relaxed opacity-90 mb-6">
                Estamos listos para llevar tu proyecto adelante. Desde la idea inicial hasta el lanzamiento 
                y más allá. Contacta ahora para una consultoría gratuita y descubre cómo podemos ayudarte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <a href="mailto:lazaroyunier96@outlook.es">
                    Contactar Ahora
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent hidden border-primary-foreground/20 hover:bg-primary-foreground/10" asChild>
                  <a href="/portfolio">
                    Ver Proyectos
                  </a>
                </Button>
              </div>
            </div>
          </Card>

          <div className="bg-muted/50 rounded-lg p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Nuestros Servicios</h2>
            <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
              <div className="text-center">
                <h4 className="font-semibold mb-2">Sitios Web Corporativos</h4>
                <p className="text-sm text-muted-foreground">Presencia profesional online</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">E-commerce</h4>
                <p className="text-sm text-muted-foreground">Tiendas online completas</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Aplicaciones Web</h4>
                <p className="text-sm text-muted-foreground">Plataformas personalizadas</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Sistemas Empresariales</h4>
                <p className="text-sm text-muted-foreground">ERP, CRM y más</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">APIs y Microservicios</h4>
                <p className="text-sm text-muted-foreground">Integraciones robustas</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Consultoría Digital</h4>
                <p className="text-sm text-muted-foreground">Estrategia y arquitectura</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}