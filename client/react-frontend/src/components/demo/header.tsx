import { User, HelpCircle, Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-800 rounded"/>
            <span className="font-bold text-lg">SYSGD</span>
          </div>
          <div className="text-sm text-gray-600">Archivo de Gestión: 📁 Funcionario - Lazaro</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4" />
            <div>
              <div className="font-medium">Lazaro Yunier Salazar Rodriguez</div>
              <div className="text-gray-500 text-xs">lazaroyunier96@gmail.com</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium">Acerca de...</div>
            <HelpCircle className="w-4 h-4 ml-auto" />
          </div>
        </div>
      </div>
    </header>
  )
}
