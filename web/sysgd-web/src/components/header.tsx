import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Inicio", href: "/" },
  { name: "Roadmap", href: "/roadmap" },
  { name: "Actualizaciones", href: "/updates" },
  { name: "API y Precios", href: "/api" },
  { name: "Filosofía", href: "/philosophy" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = window.location.pathname
  

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          </div>
        </div>
      )}
    </header>
  )
}
