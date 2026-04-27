import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Github, Mail, Building2, Users, Star, MessageCircle } from "lucide-react"
import type { FC } from "react"

const SponsorshipSection: FC = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-primary mr-3" />
              <h2 className="text-3xl md:text-4xl font-bold">Patrocinadores</h2>
            </div>
            <p className="text-muted-foreground text-lg text-pretty max-w-3xl mx-auto">
              Agradecemos profundamente a todas las personas y organizaciones que han hecho posible el desarrollo 
              y continuo crecimiento del ecosistema SYSGD. Su apoyo es fundamental para mantener este proyecto 
              de código abierto accesible para todos.
            </p>
          </div>

          <div className="grid gap-8 mb-12">
            {/* Niveles de Patrocinio */}
            <Card className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">Niveles de Patrocinio</h3>
                <p className="text-muted-foreground">
                  Cada contribución, sin importar su tamaño, nos ayuda a mejorar y expandir SYSGD
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-6 rounded-lg border bg-card">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Individual</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Desarrolladores, usuarios y entusiastas que apoyan con donaciones individuales
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Desde $5 USD mensual
                  </div>
                </div>

                <div className="text-center p-6 rounded-lg border bg-card">
                  <Building2 className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Empresa</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Empresas que utilizan SYSGD y desean apoyar su desarrollo continuo
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Desde $50 USD mensual
                  </div>
                </div>

                <div className="text-center p-6 rounded-lg border bg-card">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Premium</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Organizaciones que desean mayor visibilidad y participación en el proyecto
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Desde $200 USD mensual
                  </div>
                </div>
              </div>
            </Card>

            {/* Beneficios */}
            <Card className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">Beneficios del Patrocinio</h3>
                <p className="text-muted-foreground">
                  Tu apoyo nos permite continuar desarrollando y mejorando SYSGD
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Desarrollo Continuo</h4>
                    <p className="text-sm text-muted-foreground">
                      Financia el desarrollo de nuevas características y mejoras
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Mantenimiento</h4>
                    <p className="text-sm text-muted-foreground">
                      Asegura la estabilidad y seguridad del sistema
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Documentación</h4>
                    <p className="text-sm text-muted-foreground">
                      Mejora la documentación y materiales de aprendizaje
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Comunidad</h4>
                    <p className="text-sm text-muted-foreground">
                      Apoya eventos y actividades de la comunidad SYSGD
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Call to Action */}
            <Card className="p-8 md:p-10 bg-primary text-primary-foreground">
              <div className="text-center">
                <Heart className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">¿Quieres ser Patrocinador?</h3>
                <p className="text-lg leading-relaxed opacity-90 mb-6 max-w-2xl mx-auto">
                  Tu apoyo hace posible que SYSGD continúe creciendo como una solución de gestión de proyectos 
                  de código abierto accesible para todos. Cada contribución nos ayuda a mejorar y expandir el ecosistema.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" variant="secondary" asChild>
                    <a href="mailto:lazaroyunier96@outlook.es?subject=Patrocinio%20SYSGD">
                      <Mail className="mr-2 h-4 w-4" />
                      Contactar para Patrocinar
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
                      Ver en GitHub
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Agradecimiento Especial */}
          <Card className="p-8 border-2 border-primary/20 bg-primary/5">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-yellow-500 mr-3" />
                <h3 className="text-2xl font-bold">Agradecimiento Especial</h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
                Queremos expresar nuestra más profunda gratitud a quienes han hecho contribuciones excepcionales 
                que han sido fundamentales para el desarrollo y crecimiento del ecosistema SYSGD.
              </p>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto border shadow-sm">
                <div className="flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-red-500 mr-2" />
                  <h4 className="text-xl font-semibold">José Alfredo Rodríguez Andara</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    <strong>Contribución:</strong> Servicio de dominio y hosting gratuito para ecosysgd.com
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Su generosa contribución ha hecho posible que SYSGD tenga una presencia web estable y accesible, 
                    permitiendo que miles de usuarios puedan descubrir y utilizar esta plataforma de gestión de proyectos.
                  </p>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Contacto:</strong> +58 414-520-2394
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Conectado en Facebook como José Alfredo Rodríguez Andara
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Obtenga hosting y dominio gratuito para su proyecto hoy
                      </p>
                    <div className="mt-4">
                      <Button 
                        size="sm" 
                        className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white"
                        asChild
                      >
                        <a 
                          href="https://wa.me/584145202394?text=Hola%20José%20Alfredo,%20vi%20tu%20contribución%20en%20SYSGD%20y%20estoy%20interesado%20en%20el%20servicio%20de%20hosting%20y%20dominio%20gratuito" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contactar por WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              SYSGD es posible gracias al increíble apoyo de nuestra comunidad de patrocinadores y colaboradores.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Licencia GNU AGPL v3.0 • Propiedad intelectual de Lázaro Yunier Salazar Rodríguez
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SponsorshipSection
