import { FC } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Code2,
  Cpu,
  Github,
  Globe,
  Heart,
  Rocket,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const AboutPage: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Sobre SYSGD Ecosystem
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Una plataforma tecnológica nacida de necesidades reales, diseñada para ser{" "}
            <strong className="text-cyan-600 dark:text-cyan-400">
              accesible, intuitiva y adaptable
            </strong>
            .
          </p>
          <Badge className="mt-6 text-lg px-6 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/50 dark:to-blue-900/50 border-cyan-200 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300">
            <Sparkles className="w-5 h-5 mr-2" />
            Proyecto independiente • {currentYear}
          </Badge>
        </div>

        {/* Origen y Filosofía */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Heart className="w-8 h-8 text-red-500 dark:text-red-400" />
              Origen del proyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            <p>
              SYSGD no nació de una idea de negocio ni de una tendencia de mercado. 
              Nació de frustraciones personales vividas durante años en diferentes roles:
            </p>
            <ul className="list-disc list-inside space-y-3 ml-4">
              <li>
                <strong>Como técnico en gestión documental:</strong> Ahogado en papeles, registros manuales y búsquedas eternas en archivos físicos.
              </li>
              <li>
                <strong>Como desarrollador:</strong> Necesitando una forma simple y rápida de organizar tareas sin herramientas pesadas.
              </li>
              <li>
                <strong>Como Scrum Master:</strong> Perdiendo tardes enteras generando informes de GitHub que ahora se hacen en minutos.
              </li>
            </ul>
            <p>
              Un día decidí construir la herramienta que yo mismo necesitaba: rápida, limpia, accesible desde cualquier lugar y sin barreras regionales.
            </p>
            <p>
              Así nació <strong>SYSGD Ecosystem</strong>: una plataforma creada por alguien que entiende de verdad los problemas que resuelve.
            </p>
          </CardContent>
        </Card>

        {/* Filosofía y Valores */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Zap className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
              Nuestra filosofía
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Globe className="w-6 h-6 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Accesibilidad global</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Diseñada para funcionar sin bloqueos regionales ni restricciones de pago. Para todos, en cualquier lugar.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Cpu className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Simplicidad y velocidad</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Pantallas limpias, sin ruido visual, carga rápida. Trabaja en paz.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Privacidad y control</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Tus datos son tuyos. Infraestructura transparente y opciones locales cuando sea posible.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Rocket className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Evolución constante</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Actualizaciones frecuentes basadas en uso real, no en modas.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Extensibilidad futura</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Próximamente: sistema de extensiones (pullings) para que equipes o empresas añadan módulos personalizados.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Comunidad primero</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Escuchamos a los usuarios reales. Cada mejora viene de necesidades concretas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visión Futura */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Rocket className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              Hacia dónde vamos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            <p>
              SYSGD está en constante evolución. Nuestro roadmap incluye:
            </p>
            <ul className="list-disc list-inside space-y-3 ml-4">
              <li>Sistema de <strong>extensiones/pullings</strong> estilo VS Code para funcionalidades personalizadas</li>
              <li>Más integraciones con herramientas populares (GitLab, Slack, etc.)</li>
              <li>Modelos de IA locales y multimodales avanzados</li>
              <li>Versiones móviles nativas optimizadas</li>
              <li>Marketplace de módulos creados por la comunidad</li>
              <li>Herramientas específicas para sectores (educación, salud, freelancing)</li>
            </ul>
            <p>
              Todo esto manteniendo siempre nuestros principios: simplicidad, velocidad y accesibilidad.
            </p>
          </CardContent>
        </Card>

        {/* Creador */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Github className="w-8 h-8 text-gray-700 dark:text-gray-300" />
              Creado por
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                LY
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Lázaro Yunier Salazar Rodríguez
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Desarrollador Full Stack • Scrum Master • Apasionado de la productividad real
                </p>
                <div className="flex gap-4 mt-4 justify-center sm:justify-start">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://github.com/lazaroysr96" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://x.com/SYSGD_" target="_blank" rel="noopener noreferrer">
                      <Users className="w-4 h-4 mr-2" />
                      X / Twitter
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-12 dark:bg-gray-700" />

        {/* CTA Final */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            ¿Quieres ser parte del ecosistema?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Únete a los usuarios que ya están transformando su forma de trabajar con SYSGD.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700" asChild>
              <Link to="/login">
                <Rocket className="w-5 h-5 mr-2" />
                Acceder al Ecosistema
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/privacy">
                <Shield className="w-5 h-5 mr-2" />
                Ver Políticas
              </Link>
            </Button>
          </div>
        </div>

        <div className="text-center mt-12 text-sm text-gray-500 dark:text-gray-500">
          <p>© {currentYear} SYSGD Ecosystem • Proyecto independiente con ❤️ desde Cuba</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;