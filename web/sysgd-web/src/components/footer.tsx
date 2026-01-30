import { Github, Mail, Phone } from "lucide-react"
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SG</span>
              </div>
              <span className="font-semibold text-lg">SYSGD Ecosystem</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Ecosistema modular de código abierto para la productividad empresarial. Desarrollado con pasión por la
              comunidad.
            </p>
            <p className="text-xs text-muted-foreground mt-4">GNU AGPL v3.0 License</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navegación</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link to="/updates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Novedades
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Servicios
                </Link>
              </li>
              {/* <li>
                <Link to="/api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  API y Precios
                </Link>
              </li> */}
              <li>
                <Link
                  to="/philosophy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Filosofía
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:lazaroyunier96@outlook.es"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/5351158544"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SYSGD-Ecosystem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SYSGD Ecosystem. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
