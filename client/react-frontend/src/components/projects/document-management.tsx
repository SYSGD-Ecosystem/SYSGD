import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save } from "lucide-react"

export function DocumentManagement() {
  const documents = [
    {
      id: 1,
      fecha: "05/07/2025",
      tipo: "Archivo",
      sujeto: "CDR JM",
      titulo: "Plan de trabajo - Julio",
      observaciones: "Lazaro",
    },
    {
      id: 2,
      fecha: "05/07/2025",
      tipo: "Archivo",
      sujeto: "CDR JM",
      titulo: "Plan de trabajo - Julio",
      observaciones: "Yamila",
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">ANEXO</h1>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">REGISTRO DE ENTRADA DE DOCUMENTOS</h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">A2</div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <div>
            <span className="font-medium">ENTIDAD:</span> CDR
          </div>
          <div>
            <span className="font-medium">OFICINA PRODUCTORA:</span> FUNCIONARIO - LAZARO
          </div>
        </div>
      </div>

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">NO. REG. ENTRADA</TableHead>
              <TableHead className="text-center">FECHA</TableHead>
              <TableHead className="text-center">TIPO DE DOCUMENTO</TableHead>
              <TableHead className="text-center">SUJETO PRODUCTOR</TableHead>
              <TableHead className="text-center">TÍTULO</TableHead>
              <TableHead className="text-center">OBSERVACIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="text-center">{doc.id}</TableCell>
                <TableCell className="text-center">{doc.fecha}</TableCell>
                <TableCell className="text-center">{doc.tipo}</TableCell>
                <TableCell className="text-center">{doc.sujeto}</TableCell>
                <TableCell className="text-center">{doc.titulo}</TableCell>
                <TableCell className="text-center">{doc.observaciones}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Fila
          </Button>
          <Button size="sm">
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
