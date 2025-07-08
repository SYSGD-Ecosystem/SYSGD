"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Save, CheckCircle, Clock, AlertCircle, Edit, Trash2 } from "lucide-react"

interface Task {
  id: number
  fecha: string
  tipo: string
  prioridad: string
  titulo: string
  descripcion?: string
  estado: string
  asignado: string
}

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      fecha: "05/07/2025",
      tipo: "Tarea",
      prioridad: "Alta",
      titulo: "Implementar sistema de autenticación",
      descripcion: "Desarrollar el módulo completo de login y registro",
      estado: "En Progreso",
      asignado: "Lazaro",
    },
    {
      id: 2,
      fecha: "06/07/2025",
      tipo: "Idea",
      prioridad: "Media",
      titulo: "Mejorar interfaz de usuario",
      descripcion: "Revisar y actualizar el diseño de la aplicación",
      estado: "Pendiente",
      asignado: "Yamila",
    },
    {
      id: 3,
      fecha: "07/07/2025",
      tipo: "Nota",
      prioridad: "Baja",
      titulo: "Reunión con cliente programada",
      descripcion: "Preparar agenda y documentos para la reunión",
      estado: "Completado",
      asignado: "Equipo",
    },
  ])

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completado":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "En Progreso":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "Pendiente":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return null
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const handleSaveTask = () => {
    if (editingTask) {
      setTasks(tasks.map((task) => (task.id === editingTask.id ? editingTask : task)))
      setEditingTask(null)
      setIsDialogOpen(false)
    }
  }

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const handleAddNewTask = () => {
    const newTask: Task = {
      id: Math.max(...tasks.map((t) => t.id)) + 1,
      fecha: new Date().toLocaleDateString("es-ES"),
      tipo: "Tarea",
      prioridad: "Media",
      titulo: "",
      descripcion: "",
      estado: "Pendiente",
      asignado: "Sin asignar",
    }
    setEditingTask(newTask)
    setIsDialogOpen(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">GESTIÓN DE TAREAS</h1>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">REGISTRO DE TAREAS Y ACTIVIDADES</h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">GT1</div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <div>
            <span className="font-medium">PROYECTO:</span> Sistema de Gestión Documental
          </div>
          <div>
            <span className="font-medium">RESPONSABLE:</span> FUNCIONARIO - LAZARO
          </div>
        </div>
      </div>

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">ID</TableHead>
              <TableHead className="text-center">FECHA</TableHead>
              <TableHead className="text-center">TIPO</TableHead>
              <TableHead className="text-center">PRIORIDAD</TableHead>
              <TableHead className="text-center">TÍTULO</TableHead>
              <TableHead className="text-center">ESTADO</TableHead>
              <TableHead className="text-center">ASIGNADO</TableHead>
              <TableHead className="text-center">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="text-center">{task.id}</TableCell>
                <TableCell className="text-center">{task.fecha}</TableCell>
                <TableCell className="text-center">{task.tipo}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={getPriorityColor(task.prioridad)}>{task.prioridad}</Badge>
                </TableCell>
                <TableCell className="text-center">{task.titulo}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(task.estado)}
                    {task.estado}
                  </div>
                </TableCell>
                <TableCell className="text-center">{task.asignado}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditTask(task)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={handleAddNewTask}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Tarea
          </Button>
          <Button size="sm">
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask?.id && tasks.find((t) => t.id === editingTask.id) ? "Editar Tarea" : "Nueva Tarea"}
            </DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={editingTask.titulo}
                  onChange={(e) => setEditingTask({ ...editingTask, titulo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={editingTask.descripcion || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, descripcion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={editingTask.tipo}
                    onValueChange={(value) => setEditingTask({ ...editingTask, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tarea">Tarea</SelectItem>
                      <SelectItem value="Idea">Idea</SelectItem>
                      <SelectItem value="Nota">Nota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select
                    value={editingTask.prioridad}
                    onValueChange={(value) => setEditingTask({ ...editingTask, prioridad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={editingTask.estado}
                    onValueChange={(value) => setEditingTask({ ...editingTask, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="En Progreso">En Progreso</SelectItem>
                      <SelectItem value="Completado">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="asignado">Asignado</Label>
                  <Input
                    id="asignado"
                    value={editingTask.asignado}
                    onChange={(e) => setEditingTask({ ...editingTask, asignado: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveTask}>Guardar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
