import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette } from "lucide-react"

/*interface SpreadsheetToolbarProps {
  onFormatChange?: (format: string) => void
}*/

export const SpreadsheetToolbar = (/*{ onFormatChange }: SpreadsheetToolbarProps*/) => {
  return (
    <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2 flex-wrap">
      {/* Formato de texto */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
        <Select defaultValue="arial">
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arial">Arial</SelectItem>
            <SelectItem value="helvetica">Helvetica</SelectItem>
            <SelectItem value="times">Times New Roman</SelectItem>
            <SelectItem value="courier">Courier New</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="12">
          <SelectTrigger className="w-16 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="12">12</SelectItem>
            <SelectItem value="14">14</SelectItem>
            <SelectItem value="16">16</SelectItem>
            <SelectItem value="18">18</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estilos de texto */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
        <Button size="sm" variant="outline">
          <Bold className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline">
          <Italic className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline">
          <Underline className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline">
          <Palette className="w-4 h-4" />
        </Button>
      </div>

      {/* Alineación */}
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline">
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline">
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline">
          <AlignRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
