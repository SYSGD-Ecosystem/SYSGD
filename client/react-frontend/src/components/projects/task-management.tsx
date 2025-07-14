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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, CheckCircle, Clock, AlertCircle, Search, Filter, X } from "lucide-react"

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
    // Agregar más tareas para demostrar el scroll
    {
      id: 4,
      fecha: "08/07/2025",
      tipo: "Tarea",
      prioridad: "Alta",
      titulo: "Optimizar base de datos",
      descripcion: "Mejorar el rendimiento de las consultas principales",
      estado: "Pendiente",
      asignado: "Carlos",
    },
    {
      id: 5,
      fecha: "09/07/2025",
      tipo: "Tarea",
      prioridad: "Media",
      titulo: "Crear documentación técnica",
      descripcion: "Documentar APIs y componentes principales",
      estado: "En Progreso",
      asignado: "María",
    },
    {
      id: 6,
      fecha: "10/07/2025",
      tipo: "Idea",
      prioridad: "Baja",
      titulo: "Implementar modo oscuro",
      descripcion: "Agregar soporte para tema oscuro en toda la aplicación",
      estado: "Pendiente",
      asignado: "Yamila",
    },
    {
      id: 7,
      fecha: "11/07/2025",
      tipo: "Tarea",
      prioridad: "Alta",
      titulo: "Configurar CI/CD",
      descripcion: "Establecer pipeline de integración y despliegue continuo",
      estado: "Pendiente",
      asignado: "DevOps",
    },
    {
      id: 8,
      fecha: "12/07/2025",
      tipo: "Nota",
      prioridad: "Media",
      titulo: "Revisión de código semanal",
      descripcion: "Sesión de code review con todo el equipo",
      estado: "Completado",
      asignado: "Equipo",
    },
  ])

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterAssignee, setFilterAssignee] = useState("todos")
  const [filterType, setFilterType] = useState("todos")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [showFilters, setShowFilters] = useState(false)

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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDialogOpen(true)
  }

  const handleEditTask = () => {
    if (selectedTask) {
      setEditingTask({ ...selectedTask })
      setIsDialogOpen(false)
      setIsAddDialogOpen(true)
    }
  }

  const handleSaveTask = () => {
    if (editingTask) {
      if (tasks.find((t) => t.id === editingTask.id)) {
        setTasks(tasks.map((task) => (task.id === editingTask.id ? editingTask : task)))
      } else {
        setTasks([...tasks, editingTask])
      }
      setEditingTask(null)
      setIsAddDialogOpen(false)
    }
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
    setIsAddDialogOpen(true)
  }

  // Obtener valores únicos para los filtros
  const getUniqueAssignees = () => {
    const assignees = [...new Set(tasks.map((task) => task.asignado))]
    return assignees.filter((assignee) => assignee && assignee !== "Sin asignar")
  }

  const getUniqueTypes = () => {
    return [...new Set(tasks.map((task) => task.tipo))]
  }

  const getUniqueStatuses = () => {
    return [...new Set(tasks.map((task) => task.estado))]
  }

  // Función para filtrar tareas
  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      const matchesSearch = task.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesAssignee = filterAssignee === "todos" || task.asignado === filterAssignee
      const matchesType = filterType === "todos" || task.tipo === filterType
      const matchesStatus = filterStatus === "todos" || task.estado === filterStatus

      return matchesSearch && matchesAssignee && matchesType && matchesStatus
    })
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setFilterAssignee("todos")
    setFilterType("todos")
    setFilterStatus("todos")
  }

  // Verificar si hay filtros activos
  const hasActiveFilters = () => {
    return searchTerm !== "" || filterAssignee !== "todos" || filterType !== "todos" || filterStatus !== "todos"
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm h-full flex flex-col">
      {/* Header fijo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">GESTIÓN DE TAREAS</h1>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              REGISTRO DE TAREAS Y ACTIVIDADES
            </h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">GT1</div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <div>
            <span className="font-medium">PROYECTO:</span> Sistema de Gestión Documental
          </div>
          <div>
            <span className="font-medium">RESPONSABLE:</span> FUNCIONARIO - LAZARO
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`${hasActiveFilters() ? "border-blue-500 text-blue-600 dark:text-blue-400" : ""}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {hasActiveFilters() && <span className="ml-1 bg-blue-500 text-white rounded-full w-2 h-2" />}
              </Button>

              {hasActiveFilters() && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>
              )}

              <Button onClick={handleAddNewTask}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por usuario asignado */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Usuario Asignado</Label>
                  <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los usuarios</SelectItem>
                      {getUniqueAssignees().map((assignee) => (
                        <SelectItem key={assignee} value={assignee}>
                          {assignee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por tipo */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      {getUniqueTypes().map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por estado */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Estado</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      {getUniqueStatuses().map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resumen de filtros activos */}
              {hasActiveFilters() && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Mostrando {getFilteredTasks().length} de {tasks.length} tareas
                    </span>
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        Título: "{searchTerm}"
                      </Badge>
                    )}
                    {filterAssignee !== "todos" && (
                      <Badge variant="secondary" className="text-xs">
                        Usuario: {filterAssignee}
                      </Badge>
                    )}
                    {filterType !== "todos" && (
                      <Badge variant="secondary" className="text-xs">
                        Tipo: {filterType}
                      </Badge>
                    )}
                    {filterStatus !== "todos" && (
                      <Badge variant="secondary" className="text-xs">
                        Estado: {filterStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenedor de tabla con scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header de tabla fijo */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center w-16 py-4">ID</TableHead>
                  <TableHead className="text-center w-24">FECHA</TableHead>
                  <TableHead className="text-center w-20">TIPO</TableHead>
                  <TableHead className="text-center w-24">PRIORIDAD</TableHead>
                  <TableHead className="text-left min-w-[200px]">TÍTULO</TableHead>
                  <TableHead className="text-center w-32">ESTADO</TableHead>
                  <TableHead className="text-center w-24">ASIGNADO</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          {/* Body de tabla con scroll */}
          <ScrollArea className="flex-1">
            <Table>
              <TableBody>
                {getFilteredTasks().map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleTaskClick(task)}
                  >
                    <TableCell className="text-center w-16 py-4 font-medium">{task.id}</TableCell>
                    <TableCell className="text-center w-24">{task.fecha}</TableCell>
                    <TableCell className="text-center w-20">{task.tipo}</TableCell>
                    <TableCell className="text-center w-24">
                      <Badge variant={getPriorityColor(task.prioridad)}>{task.prioridad}</Badge>
                    </TableCell>
                    <TableCell className="text-left min-w-[200px] font-medium">{task.titulo}</TableCell>
                    <TableCell className="text-center w-32">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(task.estado)}
                        <span className="text-sm">{task.estado}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center w-24">{task.asignado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {getFilteredTasks().length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-500 mb-2">
                  <Search className="w-12 h-12 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No se encontraron tareas</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {hasActiveFilters()
                    ? "Intenta ajustar los filtros para encontrar lo que buscas"
                    : "No hay tareas disponibles en este momento"}
                </p>
                {hasActiveFilters() && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Diálogo para ver detalles de tarea */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles de la Tarea</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID</Label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedTask.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</Label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedTask.fecha}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</Label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedTask.titulo}</p>
              </div>

              {selectedTask.descripcion && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</Label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedTask.descripcion}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</Label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedTask.tipo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prioridad</Label>
                  <Badge variant={getPriorityColor(selectedTask.prioridad)}>{selectedTask.prioridad}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</Label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTask.estado)}
                    <span className="text-sm text-gray-900 dark:text-white">{selectedTask.estado}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Asignado a</Label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedTask.asignado}</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={handleEditTask}>Editar Tarea</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para agregar/editar tarea */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
