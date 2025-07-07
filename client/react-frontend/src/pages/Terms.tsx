import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { FileText, Mail, Phone } from "lucide-react"

export default function TermsAndConditions() {
  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones de Uso</h1>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            SYSGD - Sistema de Gestión Documental
          </Badge>
          <p className="text-gray-600 mt-4">
            <strong>Fecha de entrada en vigor:</strong> {currentDate}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed">
              Bienvenido a <strong>SYSGD (Sistema de Gestión Documental)</strong>. Al registrarte y utilizar este
              sistema, aceptas los siguientes Términos y Condiciones. Si no estás de acuerdo, por favor, no utilices la
              plataforma.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Sobre SYSGD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                SYSGD es una plataforma en desarrollo destinada a la digitalización y gestión documental. Actualmente se
                encuentra en <strong>fase beta</strong>, por lo que muchas funciones están en desarrollo activo y pueden
                cambiar, fallar o comportarse de forma inesperada.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Uso permitido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-3">El usuario se compromete a:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Utilizar SYSGD únicamente con fines legítimos y conforme a las leyes aplicables.</li>
                <li>No intentar acceder, alterar o eliminar datos de otros usuarios.</li>
                <li>No cargar contenido ilegal, ofensivo o que viole derechos de terceros.</li>
                <li>No realizar ingeniería inversa, hackeo o pruebas de seguridad sin autorización.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Cuentas de usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>El usuario es responsable de mantener la confidencialidad de sus credenciales.</li>
                <li>El uso indebido de cuentas puede derivar en la suspensión o eliminación sin previo aviso.</li>
                <li>
                  La eliminación de una cuenta puede solicitarse mediante contacto directo con el administrador del
                  sistema.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  4
                </span>
                Disponibilidad del servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>SYSGD no garantiza disponibilidad continua, integridad de los datos ni ausencia de errores.</li>
                <li>
                  El servicio puede sufrir interrupciones sin previo aviso debido a mantenimiento, errores o pruebas de
                  nuevas funcionalidades.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  5
                </span>
                Propiedad intelectual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Todo el código, estructura, diseño y elementos internos de SYSGD pertenecen a su creador. El uso del
                sistema no implica cesión de derechos, salvo los necesarios para acceder y utilizar sus funcionalidades
                conforme a estos términos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  6
                </span>
                Modificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios serán
                notificados dentro de la plataforma. El uso continuado de SYSGD después de dichos cambios implica tu
                aceptación.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  7
                </span>
                Limitación de responsabilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                SYSGD se proporciona "tal cual está", sin garantías de ningún tipo. El desarrollador no se
                responsabiliza por pérdidas de datos, accesos no autorizados, ni daños derivados del uso del sistema.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  8
                </span>
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Para cualquier duda o solicitud relacionada con estos términos, puedes escribir a:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <a href="mailto:lazaroyunier96@outlook.es" className="text-blue-600 hover:underline">
                    lazaroyunier96@outlook.es
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="h-5 w-5 text-green-600" />
                  <a href="https://wa.me/5351158544" className="text-green-600 hover:underline">
                    WhatsApp: +53 5115 8544
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-700 mb-2">
              <strong>Gracias por formar parte del programa beta.</strong> Cada usuario ayuda a mejorar este proyecto.
            </p>
            <p className="text-blue-700 font-medium">
              SYSGD es un sistema vivo, en evolución. Y tú eres parte de esa historia.
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 SYSGD - Sistema de Gestión Documental</p>
        </div>
      </div>
    </div>
  )
}
