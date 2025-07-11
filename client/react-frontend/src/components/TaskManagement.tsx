import { type FC, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, CheckCircle, Clock, AlertCircle, Edit, Trash2 } from "lucide-react"
import { useTasks } from "@/hooks/connection/useTask"
import type { Task } from "@/types/Task"
import { formatSimpleDate } from "@/utils/util"

const TaskManagement: FC<{project_id:string}> = ({project_id}) => {
  const { tasks, loading, createTask } = useTasks(project_id);
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

if (loading) return <div>Cargando tareas...</div>


const handleSaveTask = async () => {
  if (editingTask) {
    await createTask(editingTask);
    setEditingTask(null);
    setIsDialogOpen(false);
  }
};


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

  const handleDeleteTask = (_taskId: string) => {
  }

  const handleAddNewTask = () => {

    const newTask: Task = {
      id: "1",
      type: "Tarea",
      priority: "Media",
      title: "",
      description: "",
      status: "Pendiente",
      assignees: "Sin asignar",
      created_at: "",
      project_id
    }
    setEditingTask(newTask)

    setIsDialogOpen(true)
  }

  return (
    <div className="bg-white rounded-lg dark:border shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">GESTIÓN DE TAREAS</h1>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-400 mb-4">REGISTRO DE TAREAS Y ACTIVIDADES</h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">GT1</div>
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
              <TableHead className="text-left">TÍTULO</TableHead>
              <TableHead className="text-left">ESTADO</TableHead>
              <TableHead className="text-left">ASIGNADO</TableHead>
              <TableHead className="text-center">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="text-center">{task.project_task_number}</TableCell>
                <TableCell className="text-center">{formatSimpleDate(task.created_at)}</TableCell>
                <TableCell className="text-center">{task.type}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                </TableCell>
                <TableCell className="text-left">{task.title}</TableCell>
                <TableCell className="text-left">
                  <div className="flex items-start justify-start gap-2">
                    {getStatusIcon(task.status)}
                    {task.status}
                  </div>
                </TableCell>
                <TableCell className="text-center">{task.assignees}</TableCell>
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
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={editingTask.type}
                    onValueChange={(value) => setEditingTask({ ...editingTask, type: value })}
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
                    value={editingTask.priority}
                    onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
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
                    value={editingTask.status}
                    onValueChange={(value) => setEditingTask({ ...editingTask, status: value })}
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
                    value={editingTask.assignees}
                    onChange={(e) => setEditingTask({ ...editingTask, assignees: e.target.value })}
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

export default TaskManagement
