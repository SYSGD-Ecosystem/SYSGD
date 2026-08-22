import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, Menu, UserRound, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { LoginDialog } from "@/components/login-dialog"

const navigation = [
  { name: "Inicio", href: "/" },
  { name: "Roadmap", href: "/roadmap" },
  { name: "Novedades", href: "/updates" },
  { name: "Descubre", href: "/descubre" },
  { name: "Servicios", href: "/services" },
  { name: "Aplicaciones", href: "/apps" },
  // { name: "API y Precios", href: "/api" },
  { name: "Filosofía", href: "/philosophy" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const pathname = window.location.pathname
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  const authButtons = (
    <>
      {user ? (
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground max-w-[160px]">
            <UserRound className="w-4 h-4 shrink-0" />
            <span className="truncate">{user.name || user.email}</span>
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Salir
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
          <LogIn className="w-4 h-4" />
          Iniciar sesión
        </Button>
      )}
    </>
  )


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SG</span>
          </div>
          <span className="font-semibold text-lg">SYSGD</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.name}
            </Link>
          ))}
          <Button asChild>
            <a href="https://github.com/SYSGD-Ecosystem" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </Button>
          {authButtons}
        </div>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "block px-3 py-2 text-base font-medium rounded-md transition-colors",
                  pathname === item.href ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Button asChild className="w-full">
              <a href="https://github.com/SYSGD-Ecosystem" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </Button>
            <div className="pt-2">{authButtons}</div>
          </div>
        </div>
      )}

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  )
}
