"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, ThumbsUp, ThumbsDown, Lightbulb, Calendar, User, Star } from "lucide-react"

interface Idea {
  id: number
  titulo: string
  descripcion: string
  categoria: string
  autor: string
  fechaCreacion: string
  estado: string
  prioridad: string
  votos: number
  implementabilidad: string
  impacto: string
}

export function IdeasBank() {
  const [ideas, setIdeas] = useState<Idea[]>([
    {
      id: 1,
      titulo: "Sistema de notificaciones push",
      descripcion:
        "Implementar un sistema de notificaciones en tiempo real para mantener a los usuarios informados sobre cambios importantes en sus documentos y tareas.",
      categoria: "Funcionalidad",
      autor: "Lazaro",
      fechaCreacion: "05/07/2025",
      estado: "En Evaluación",
      prioridad: "Alta",
      votos: 8,
      implementabilidad: "Media",
      impacto: "Alto",
    },
    {
      id: 2,
      titulo: "Modo oscuro para la interfaz",
      descripcion:
        "Agregar un tema oscuro para mejorar la experiencia de usuario durante el trabajo nocturno y reducir la fatiga visual.",
      categoria: "UX/UI",
      autor: "Yamila",
      fechaCreacion: "06/07/2025",
      estado: "Aprobada",
      prioridad: "Media",
      votos: 12,
      implementabilidad: "Alta",
      impacto: "Medio",
    },
    {
      id: 3,
      titulo: "Integración con servicios de nube",
      descripcion:
        "Permitir la sincronización automática de documentos con servicios como Google Drive, Dropbox y OneDrive para facilitar el acceso desde múltiples dispositivos.",
      categoria: "Integración",
      autor: "Carlos",
      fechaCreacion: "04/07/2025",
      estado: "Pendiente",
      prioridad: "Baja",
      votos: 5,
      implementabilidad: "Baja",
      impacto: "Alto",
    },
    {
      id: 4,
      titulo: "Dashboard analítico",
      descripcion:
        "Crear un dashboard con métricas y análisis sobre el uso del sistema, productividad del equipo y estadísticas de documentos.",
      categoria: "Analytics",
      autor: "María",
      fechaCreacion: "03/07/2025",
      estado: "En Desarrollo",
      prioridad: "Alta",
      votos: 15,
      implementabilidad: "Media",
      impacto: "Alto",
    },
  ])

  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState("Todas")

  const statuses = ["Todas", "Pendiente", "En Evaluación", "Aprobada", "En Desarrollo", "Implementada", "Rechazada"]
  const categories = ["Funcionalidad", "UX/UI", "Integración", "Analytics", "Seguridad", "Performance"]

  const filteredIdeas = ideas.filter((idea) => filterStatus === "Todas" || idea.estado === filterStatus)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendiente":
        return "bg-gray-100 text-gray-800"
      case "En Evaluación":
        return "bg-yellow-100 text-yellow-800"
      case "Aprobada":
        return "bg-green-100 text-green-800"
      case "En Desarrollo":
        return "bg-blue-100 text-blue-800"
      case "Implementada":
        return "bg-purple-100 text-purple-800"
      case "Rechazada":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "destructive"
      case "Media":
        return "default"
      case "Baja":
        return "secondary"
      default:
        return "default"
    }
  }

  const getImplementabilityIcon = (level: string) => {
    switch (level) {
      case "Alta":
        return <Star className="w-4 h-4 text-green-500" />
      case "Media":
        return <Star className="w-4 h-4 text-yellow-500" />
      case "Baja":
        return <Star className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const handleVote = (ideaId: number, increment: boolean) => {
    setIdeas(ideas.map((idea) => (idea.id === ideaId ? { ...idea, votos: idea.votos + (increment ? 1 : -1) } : idea)))
  }

  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea)
    setIsDialogOpen(true)
  }

  const handleAddNewIdea = () => {
    const newIdea: Idea = {
      id: Math.max(...ideas.map((i) => i.id)) + 1,
      titulo: "",
      descripcion: "",
      categoria: "Funcionalidad",
      autor: "Usuario",
      fechaCreacion: new Date().toLocaleDateString("es-ES"),
      estado: "Pendiente",
      prioridad: "Media",
      votos: 0,
      implementabilidad: "Media",
      impacto: "Medio",
    }
    setEditingIdea(newIdea)
    setIsDialogOpen(true)
  }

  const handleSaveIdea = () => {
    if (editingIdea) {
      if (ideas.find((i) => i.id === editingIdea.id)) {
        setIdeas(ideas.map((idea) => (idea.id === editingIdea.id ? editingIdea : idea)))
      } else {
        setIdeas([...ideas, editingIdea])
      }
      setEditingIdea(null)
      setIsDialogOpen(false)
    }
  }

  const handleDeleteIdea = (ideaId: number) => {
    setIdeas(ideas.filter((idea) => idea.id !== ideaId))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">BANCO DE IDEAS</h1>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">GESTIÓN DE IDEAS E INNOVACIÓN</h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">BI1</div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-600">Total: {filteredIdeas.length} ideas</div>
          </div>
          <Button onClick={handleAddNewIdea}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Idea
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredIdeas.map((idea) => (
            <Card key={idea.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-500 mt-1" />
                    <div>
                      <CardTitle className="text-lg font-medium">{idea.titulo}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getStatusColor(idea.estado)}>{idea.estado}</Badge>
                        <Badge variant={getPriorityColor(idea.prioridad)}>{idea.prioridad}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditIdea(idea)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteIdea(idea.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{idea.descripcion}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Implementabilidad:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {getImplementabilityIcon(idea.implementabilidad)}
                      {idea.implementabilidad}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Impacto:</span>
                    <div className="mt-1">{idea.impacto}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {idea.autor}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {idea.fechaCreacion}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleVote(idea.id, false)}>
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-medium">{idea.votos}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleVote(idea.id, true)}>
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay ideas que coincidan con el filtro seleccionado.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIdea?.id && ideas.find((i) => i.id === editingIdea.id) ? "Editar Idea" : "Nueva Idea"}
            </DialogTitle>
          </DialogHeader>
          {editingIdea && (
            <div className="space-y-4">
              <div>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={editingIdea.titulo}
                  onChange={(e) => setEditingIdea({ ...editingIdea, titulo: e.target.value })}
                  placeholder="Título de la idea"
                />
              </div>
              <div>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={editingIdea.descripcion}
                  onChange={(e) => setEditingIdea({ ...editingIdea, descripcion: e.target.value })}
                  placeholder="Descripción detallada de la idea"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                  <label className="text-sm font-medium">Categoría</label>
                  <select
                    value={editingIdea.categoria}
                    onChange={(e) => setEditingIdea({ ...editingIdea, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                  <label className="text-sm font-medium">Prioridad</label>
                  <select
                    value={editingIdea.prioridad}
                    onChange={(e) => setEditingIdea({ ...editingIdea, prioridad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                  <label className="text-sm font-medium">Implementabilidad</label>
                  <select
                    value={editingIdea.implementabilidad}
                    onChange={(e) => setEditingIdea({ ...editingIdea, implementabilidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div>
                  {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                  <label className="text-sm font-medium">Impacto</label>
                  <select
                    value={editingIdea.impacto}
                    onChange={(e) => setEditingIdea({ ...editingIdea, impacto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="Alto">Alto</option>
                    <option value="Medio">Medio</option>
                    <option value="Bajo">Bajo</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveIdea}>Guardar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
