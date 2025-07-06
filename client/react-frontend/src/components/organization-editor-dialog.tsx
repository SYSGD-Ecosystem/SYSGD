import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import type { OrgNode } from "@/hooks/connection/useOrganizationChart"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialData: OrgNode | null
  onSave: (tree: OrgNode) => Promise<void>
}

export function OrganizationEditorDialog({ open, onOpenChange, initialData, onSave }: Props) {
  const [json, setJson] = useState<string>(() => JSON.stringify(initialData ?? {}, null, 2))
  const [error, setError] = useState<string | null>(null)
  const handleSave = async () => {
    try {
      const parsed = JSON.parse(json)
      await onSave(parsed)
      onOpenChange(false)
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (e: any) {
      setError(e.message)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Organigrama (JSON)</DialogTitle>
        </DialogHeader>
        <Textarea value={json} onChange={(e) => setJson(e.target.value)} className="min-h-[300px] font-mono text-sm" />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
