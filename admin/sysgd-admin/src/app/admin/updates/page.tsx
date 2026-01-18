"use client"

import { useState, useMemo } from "react"

import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { Badge } from "../../../components/ui/badge"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Calendar, 
  FileText,
  Sparkles,
  TrendingUp,
  Megaphone,
  BookOpen,
  Shield
} from "lucide-react"
import { Button } from "../../../components/ui/button"

// Tipos basados en la estructura existente de SYSGD
interface Update {
  id: string
  date: string
  title: string
  description: string
  category: "Nueva Funcionalidad" | "Mejora" | "Anuncio" | "Documentación" | "Seguridad"
}

// Datos de ejemplo basados en la estructura real
const initialUpdates: Update[] = [
  {
    id: "6",
    date: "2025-12-22",
    title: "Integración con GitHub para Rastreo de Actividad",
    description:
      "Nueva integración que permite conectar repositorios de GitHub para obtener información detallada de Pull Requests: usuario creador, líneas añadidas/eliminadas y archivos modificados. Ideal para empresas y pequeños equipos que necesitan rastrear el nivel de actividad real de cada desarrollador.",
    category: "Nueva Funcionalidad",
  },
  {
    id: "7",
    date: "2025-12-22",
    title: "Dinamización de Tareas y Editor Mejorado",
    description:
      "Estamos trabajando en hacer las tareas más flexibles permitiendo asignar tipos, estados y otros elementos de forma dinámica en lugar de fija. Para ello se habilitó una nueva página de ajustes. También implementamos mejoras sustanciales en el editor de tareas.",
    category: "Mejora",
  },
  {
    id: "1",
    date: "2025-12-21",
    title: "Lanzamiento de la Página Institucional",
    description:
      "Hemos lanzado la página institucional pública de SYSGD Ecosystem. Este espacio permitirá a la comunidad seguir el progreso del proyecto, conocer el roadmap y mantenerse actualizado con las últimas novedades del desarrollo.",
    category: "Anuncio",
  },
  {
    id: "2",
    date: "2025-12-15",
    title: "Sistema de Créditos SYSGD-COINS",
    description:
      "Implementamos el sistema de créditos SYSGD-COINS que permite a los usuarios utilizar funciones potenciadas con IA generativa. Cada usuario nuevo recibe 10 monedas para experimentar las mejoras automatizadas.",
    category: "Nueva Funcionalidad",
  },
  {
    id: "4",
    date: "2025-11-20",
    title: "Documentación de API Actualizada",
    description:
      "Hemos actualizado completamente la documentación de la API RESTful con Swagger. Ahora incluye ejemplos más detallados, códigos de error mejorados y guías de integración para desarrolladores.",
    category: "Documentación",
  },
  {
    id: "5",
    date: "2025-11-05",
    title: "Refactorización del Sistema de Autenticación",
    description:
      "Completamos una refactorización importante del sistema de autenticación para mejorar la seguridad y el rendimiento. Implementamos mejores prácticas con bcrypt para el cifrado de contraseñas.",
    category: "Seguridad",
  },
]

const categoryConfig = {
  "Nueva Funcionalidad": { 
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: Sparkles 
  },
  "Mejora": { 
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: TrendingUp 
  },
  "Anuncio": { 
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Megaphone 
  },
  "Documentación": { 
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: BookOpen 
  },
  "Seguridad": { 
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: Shield 
  },
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<Update[]>(initialUpdates)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [updateToDelete, setUpdateToDelete] = useState<Update | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Anuncio" as Update["category"],
    date: new Date().toISOString().split("T")[0],
  })

  const filteredUpdates = useMemo(() => {
    return updates.filter((update) => {
      const matchesSearch =
        update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === "all" || update.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [updates, searchTerm, filterCategory])

  const stats = useMemo(() => {
    const total = updates.length
    const byCategory = updates.reduce((acc, update) => {
      acc[update.category] = (acc[update.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return { total, byCategory }
  }, [updates])

  const handleOpenDialog = (update?: Update) => {
    if (update) {
      setEditingUpdate(update)
      setFormData({
        title: update.title,
        description: update.description,
        category: update.category,
        date: update.date,
      })
    } else {
      setEditingUpdate(null)
      setFormData({
        title: "",
        description: "",
        category: "Anuncio",
        date: new Date().toISOString().split("T")[0],
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingUpdate) {
      setUpdates(
        updates.map((u) =>
          u.id === editingUpdate.id
            ? { ...u, ...formData }
            : u
        )
      )
    } else {
      const newUpdate: Update = {
        id: Date.now().toString(),
        ...formData,
      }
      setUpdates([newUpdate, ...updates])
    }
    setIsDialogOpen(false)
  }

  const handleDeleteClick = (update: Update) => {
    setUpdateToDelete(update)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (updateToDelete) {
      setUpdates(updates.filter((u) => u.id !== updateToDelete.id))
      setDeleteDialogOpen(false)
      setUpdateToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Updates</h1>
          <p className="text-muted-foreground">
            Publica actualizaciones para la página institucional de SYSGD
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Actualización
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Updates</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Funcionalidades</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.byCategory["Nueva Funcionalidad"] || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mejoras</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.byCategory["Mejora"] || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anuncios</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.byCategory["Anuncio"] || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Updates List */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Lista de Actualizaciones</CardTitle>
              <CardDescription>
                Gestiona las actualizaciones publicadas en la página institucional
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar actualizaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="Nueva Funcionalidad">Nueva Funcionalidad</SelectItem>
                <SelectItem value="Mejora">Mejora</SelectItem>
                <SelectItem value="Anuncio">Anuncio</SelectItem>
                <SelectItem value="Documentación">Documentación</SelectItem>
                <SelectItem value="Seguridad">Seguridad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-4">
            {filteredUpdates.map((update) => {
              const CategoryIcon = categoryConfig[update.category].icon
              return (
                <div
                  key={update.id}
                  className="flex flex-col p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={`${categoryConfig[update.category].color} gap-1`}
                        >
                          <CategoryIcon className="w-3 h-3" />
                          {update.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(update.date)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground text-lg mb-2">
                        {update.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {update.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenDialog(update)}
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteClick(update)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredUpdates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron actualizaciones</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUpdate ? "Editar Actualización" : "Nueva Actualización"}
            </DialogTitle>
            <DialogDescription>
              {editingUpdate
                ? "Modifica el contenido de la actualización"
                : "Crea una nueva actualización para la página institucional"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título de la actualización"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe la actualización en detalle..."
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: Update["category"]) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nueva Funcionalidad">Nueva Funcionalidad</SelectItem>
                    <SelectItem value="Mejora">Mejora</SelectItem>
                    <SelectItem value="Anuncio">Anuncio</SelectItem>
                    <SelectItem value="Documentación">Documentación</SelectItem>
                    <SelectItem value="Seguridad">Seguridad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.description}>
              {editingUpdate ? "Guardar Cambios" : "Crear Actualización"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La actualización &quot;{updateToDelete?.title}&quot; 
              será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
