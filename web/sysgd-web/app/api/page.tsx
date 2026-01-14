import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Mail, Star, Zap } from "lucide-react"

export const metadata = {
  title: "Planes y Precios - SYSGD Ecosystem",
  description: "Planes de uso de SYSGD: Free, Pro y VIP. Elige el plan que mejor se adapte a tu equipo.",
}

const plans = [
  {
    name: "Free",
    description: "Perfecto para probar el sistema",
    price: "Gratis",
    priceDetail: "Siempre gratis",
    credits: "30",
    features: [
      "30 créditos IA/mes",
      "Hasta 3 proyectos",
      "Hasta 50 tareas por proyecto",
      "Gestión documental básica",
      "Acceso al módulo de proyectos",
      "Soporte por comunidad",
    ],
    cta: "Crear Cuenta",
    highlight: false,
    href: "https://app.ecosysgd.com",
  },
  {
    name: "Pro",
    description: "Para equipos pequeños y medianos",
    price: "$10",
    priceDetail: "por mes (pago en cripto)",
    credits: "3,000",
    features: [
      "3,000 créditos IA/mes",
      "Proyectos ilimitados",
      "Tareas ilimitadas",
      "Todos los módulos incluidos",
      "Acceso a integraciones (GitHub, etc.)",
      "Chat de equipo con IA",
      "Soporte prioritario",
      "Exportación a Excel",
    ],
    cta: "Comenzar Ahora",
    highlight: true,
    href: "https://app.ecosysgd.com",
  },
  {
    name: "VIP",
    description: "Para equipos exigentes",
    price: "$20",
    priceDetail: "por mes (pago en cripto)",
    credits: "10,000",
    features: [
      "10,000 créditos IA/mes",
      "Todo lo de Pro incluido",
      "Agentes de IA personalizados",
      "Integraciones avanzadas",
      "API de acceso completo",
      "Soporte prioritario 24/7",
      "Sin límites de almacenamiento",
      "Análisis avanzados",
    ],
    cta: "Comenzar Ahora",
    highlight: false,
    href: "https://app.ecosysgd.com",
  },
]

export default function APIPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Planes y Precios
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Elige el plan perfecto para tu equipo</h1>
          <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
            SYSGD está disponible en beta pública. Pruébalo gratis o elige un plan que se adapte a las necesidades de tu
            organización. Pagos seguros mediante criptomonedas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col ${plan.highlight ? "border-primary shadow-lg relative scale-105" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Más Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                <div>
                  <div className="text-4xl font-bold">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.priceDetail}</div>
                  <div className="mt-3 flex items-center gap-2 text-primary">
                    <Zap className="h-4 w-4" />
                    <span className="font-semibold">{plan.credits} créditos/mes</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.highlight ? "default" : "outline"} asChild>
                  <a
                    href={plan.href}
                    target={plan.href.startsWith("http") ? "_blank" : undefined}
                    rel={plan.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {plan.cta}
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50 mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Prueba SYSGD en Beta Pública</CardTitle>
            <CardDescription>
              La aplicación está disponible para probar. Pueden presentarse errores o comportamientos inesperados
              mientras mejoramos continuamente el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button size="lg" asChild>
              <a href="https://app.ecosysgd.com" target="_blank" rel="noopener noreferrer">
                Comenzar Ahora Gratis
              </a>
            </Button>
            <p className="text-sm text-muted-foreground text-center max-w-2xl">
              Crea tu cuenta gratuita y comienza a gestionar tus proyectos, documentos y equipos. No se requiere tarjeta
              de crédito para el plan gratuito.
            </p>
          </CardContent>
        </Card>

        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Sistema de Créditos de IA</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                ¿Qué es un crédito?
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Un crédito equivale a una petición a nuestros servicios de inteligencia artificial. Cada vez que
                interactúas con las funciones de IA en SYSGD, se consume un crédito.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>1 mensaje al chat con agente de IA = 1 crédito</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>1 análisis de documento = 1 crédito</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>1 generación de resumen = 1 crédito</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>1 sugerencia automática = 1 crédito</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Ejemplo de uso mensual</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-2">Plan Free (30 créditos):</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Perfecto para probar el sistema. Aproximadamente 30 interacciones con IA al mes, ideal para
                    proyectos personales o de prueba.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-2">Plan Pro (3,000 créditos):</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Para equipos pequeños. Alrededor de 100 interacciones diarias con IA, suficiente para equipos de
                    3-10 personas trabajando activamente.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-2">Plan VIP (10,000 créditos):</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Para equipos grandes o uso intensivo. Más de 300 interacciones diarias, ideal para empresas con
                    múltiples proyectos simultáneos.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="mb-16 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Pagos mediante Criptomonedas</CardTitle>
            <CardDescription>Transacciones seguras, rápidas y descentralizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-2xl mx-auto space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                SYSGD acepta pagos en criptomonedas para los planes Pro y VIP. Este método de pago ofrece ventajas como
                transacciones instantáneas, comisiones reducidas y mayor privacidad.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Criptomonedas aceptadas</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Bitcoin (BTC)</li>
                    <li>• Ethereum (ETH)</li>
                    <li>• USDT (Tether)</li>
                    <li>• USDC</li>
                  </ul>
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Proceso de pago</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Selecciona tu plan</li>
                    <li>• Elige tu criptomoneda</li>
                    <li>• Realiza el pago</li>
                    <li>• Acceso inmediato</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-center mt-6">
                Los pagos se procesan automáticamente y tu cuenta se actualiza en minutos. Para dudas sobre pagos,
                contáctanos.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card id="contacto" className="bg-primary text-primary-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">¿Necesitas ayuda o un plan personalizado?</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Contacta con nosotros para discutir necesidades específicas, instalaciones locales o contratos
              empresariales
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <a href="mailto:contacto@ecosysgd.com">
                <Mail className="mr-2 h-4 w-4" />
                contacto@ecosysgd.com
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-16 prose prose-neutral dark:prose-invert max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Estado del Proyecto</h2>
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Fase Actual: Beta Pública</h3>
              <p className="text-muted-foreground leading-relaxed">
                SYSGD ya está disponible para uso público en versión beta. El repositorio es público y cualquiera puede
                acceder al código fuente en GitHub. Estamos trabajando activamente en mejoras y correcciones.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Código Abierto</h3>
              <p className="text-muted-foreground leading-relaxed">
                El código fuente de SYSGD está disponible públicamente bajo licencia GNU AGPL v3.0. Puedes explorarlo,
                contribuir o adaptarlo a tus necesidades en nuestro repositorio de GitHub.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Implementación Local</h3>
              <p className="text-muted-foreground leading-relaxed">
                Si deseas implementar SYSGD en tu propia infraestructura o necesitas soporte empresarial personalizado,
                contacta con nosotros para discutir opciones de instalación, configuración y soporte dedicado.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
