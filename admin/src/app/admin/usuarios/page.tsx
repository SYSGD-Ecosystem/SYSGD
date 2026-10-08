import { useState } from "react"

import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"
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
import { Avatar, AvatarFallback } from "../../../components/ui/avatar"
import { 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  Edit, 
  Gem, 
  Search, 
  Shield, 
  Sparkles, 
  Trash2, 
  User, 
  UserPlus, 
  UserX, 
  Users, 
  X, 
  Zap 
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { useUsers } from "../../../hooks/connection/useUsers"
import type { UserSegment } from "../../../types/user"

// Tipos basados en la estructura existente de SYSGD
interface UserData {
  billing: {
    tier: "free" | "pro" | "vip"
    ai_task_credits?: number
    plan_credits?: number
    purchased_credits?: number
    plan_validity?: {
      started_at: string
      expires_at: string
      duration_months: 1 | 3 | 12
    } | null
  }
}

interface UserType {
  id: string
  name: string
  email: string
  privileges: "admin" | "user"
  status: "active" | "invited" | "suspended" | "banned"
  user_data: UserData
}

export default function UsersPage() {
  const {
    users,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    summary,
    search,
    segment,
    setSearch,
    setSegment,
    setPage,
    setPageSize,
    createUser,
    updateUser,
    updateUserPlan,
    deleteUser,
  } = useUsers(20)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    privileges: "user" as UserType["privileges"],
    status: "active" as UserType["status"],
    tier: "free" as UserData["billing"]["tier"],
    planDurationMonths: 1 as 1 | 3 | 12,
  })

  interface SegmentCard {
    segment: UserSegment | null
    title: string
    value: number
    icon: LucideIcon
    hint: string
  }

  const segmentCards: SegmentCard[] = [
    {
      segment: null,
      title: "Total de Usuarios",
      value: summary.total,
      icon: Users,
      hint: `${summary.admins} admins · ${summary.regular} regulares`,
    },
    {
      segment: "free",
      title: "Free",
      value: summary.free,
      icon: User,
      hint: "plan gratuito",
    },
    {
      segment: "pro",
      title: "Pro",
      value: summary.pro,
      icon: Zap,
      hint: "plan pro vigente",
    },
    {
      segment: "vip",
      title: "VIP",
      value: summary.vip,
      icon: Gem,
      hint: "plan vip vigente",
    },
    {
      segment: "trial_pro",
      title: "Trial Pro",
      value: summary.trialProActive,
      icon: Sparkles,
      hint: "en periodo de prueba",
    },
    {
      segment: "manual_license",
      title: "Licencia Manual",
      value: summary.manualLicenseBuyers,
      icon: CreditCard,
      hint: "compra Transfermóvil aprobada",
    },
    {
      segment: "inactive_1y",
      title: "Inactivos 1+ año",
      value: summary.inactiveOverYear,
      icon: UserX,
      hint: "sin actividad en 365 días",
    },
  ]

  const activeSegmentCard = segmentCards.find((card) => card.segment === segment)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleOpenDialog = (user?: UserType) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        privileges: user.privileges,
        status: user.status,
        tier: user.user_data.billing.tier,
        planDurationMonths: user.user_data.billing.plan_validity?.duration_months ?? 1,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: "",
        email: "",
        password: "",
        privileges: "user",
        status: "active",
        tier: "free",
        planDurationMonths: 1,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const trimmedPassword = formData.password.trim()

    if (editingUser) {
      await updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        ...(trimmedPassword ? { password: trimmedPassword } : {}),
        privileges: formData.privileges,
        status: formData.status,
      })

      const currentDuration = editingUser.user_data.billing.plan_validity?.duration_months
      const currentTier = editingUser.user_data.billing.tier
      const requiresPlanSync =
        formData.tier !== currentTier ||
        (formData.tier !== "free" &&
          (!editingUser.user_data.billing.plan_validity ||
            currentDuration !== formData.planDurationMonths))

      if (requiresPlanSync) {
        await updateUserPlan(editingUser.id, {
          tier: formData.tier,
          ...(formData.tier !== "free"
            ? { durationMonths: formData.planDurationMonths }
            : {}),
        })
      }
    } else {
      const createdUser = await createUser({
        name: formData.name,
        email: formData.email,
        password: trimmedPassword,
        privileges: formData.privileges,
        status: formData.status,
      })

      if (formData.tier !== "free") {
        await updateUserPlan(createdUser.id, {
          tier: formData.tier,
          durationMonths: formData.planDurationMonths,
        })
      }
    }
    setIsDialogOpen(false)
  }

  const formatPlanDuration = (months?: 1 | 3 | 12) => {
    if (months === 3) return "3 meses"
    if (months === 12) return "1 ano"
    return "1 mes"
  }

  const formatDate = (value?: string) => {
    if (!value) return "Sin fecha"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Sin fecha"
    return date.toLocaleDateString("es-CU")
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return "Sin actividad"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Sin actividad"
    return date.toLocaleString("es-CU")
  }

  const handleDeleteClick = (user: UserType) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const getStatusBadge = (status: UserType["status"]) => {
    const config = {
      active: { label: "Activo", variant: "default" as const },
      invited: { label: "Invitado", variant: "secondary" as const },
      suspended: { label: "Suspendido", variant: "destructive" as const },
      banned: { label: "Baneado", variant: "destructive" as const },
    }
    return config[status]
  }

  const getTierBadge = (tier: UserData["billing"]["tier"]) => {
    const config = {
      free: { label: "Free", className: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20" },
      pro: { label: "Pro", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      vip: { label: "VIP", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    }
    return config[tier]
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestiona todos los usuarios de la plataforma
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Nuevo Usuario</span>
        </Button>
      </div>

      {/* Segment Cards (clicables para filtrar la tabla) */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {segmentCards.map((card) => {
          const Icon = card.icon
          const isActive = card.segment === segment
          return (
            <Card
              key={card.title}
              className={`border-border cursor-pointer transition-colors hover:border-primary/50 ${
                isActive ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setSegment(card.segment === segment && card.segment !== null ? null : card.segment)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Users Table */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>
                Lista completa de todos los usuarios registrados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {segment && activeSegmentCard && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSegment(null)}
                  className="gap-1 text-primary hover:text-primary"
                >
                  Filtro: {activeSegmentCard.title}
                  <X className="h-3 w-3" />
                </Button>
              )}
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive pb-3">{error}</p>}
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Privilegios</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última actividad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(user.name || "Sin nombre")}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name || "Sin nombre"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.privileges === "admin" ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {user.privileges === "admin" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {user.privileges === "admin" ? "Administrador" : "Usuario"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className={getTierBadge(user.user_data.billing.tier).className}
                        >
                          {getTierBadge(user.user_data.billing.tier).label}
                        </Badge>
                        {user.user_data.billing.plan_validity && (
                          <span className="text-xs text-muted-foreground">
                            {formatPlanDuration(user.user_data.billing.plan_validity.duration_months)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(user.status).variant}>
                        {getStatusBadge(user.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(user.last_activity_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(user)}
                          className="gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          )}

          {loading && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Cargando usuarios...
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Mostrando {users.length} de {total} usuarios · Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / página</SelectItem>
                  <SelectItem value="20">20 / página</SelectItem>
                  <SelectItem value="50">50 / página</SelectItem>
                  <SelectItem value="100">100 / página</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(page - 1, 1))}
                disabled={page <= 1 || loading}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(page + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifica los datos del usuario"
                : "Completa los datos para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan@sysgd.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">
                {editingUser ? "Nueva contraseña" : "Contraseña"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={
                  editingUser
                    ? "Déjalo vacío para mantener la actual"
                    : "Escribe una contraseña"
                }
              />
              {editingUser && (
                <p className="text-xs text-muted-foreground">
                  Solo cambia la contraseña si escribes una nueva.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="privileges">Privilegios</Label>
                <Select
                  value={formData.privileges}
                  onValueChange={(value: UserType["privileges"]) =>
                    setFormData({ ...formData, privileges: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona privilegios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value: UserData["billing"]["tier"]) =>
                    setFormData({ ...formData, tier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="planDurationMonths">Vigencia del plan</Label>
              <Select
                value={String(formData.planDurationMonths)}
                onValueChange={(value: "1" | "3" | "12") =>
                  setFormData({
                    ...formData,
                    planDurationMonths: Number(value) as 1 | 3 | 12,
                  })
                }
                disabled={formData.tier === "free"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la vigencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mes</SelectItem>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="12">1 ano</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.tier === "free"
                  ? "El plan Free no requiere vigencia."
                  : `Al activar este plan se asignan los creditos y la vigencia por ${formatPlanDuration(formData.planDurationMonths)}.`}
              </p>
              {editingUser?.user_data.billing.plan_validity && (
                <p className="text-xs text-muted-foreground">
                  Vigencia actual: {formatDate(editingUser.user_data.billing.plan_validity.started_at)} al{" "}
                  {formatDate(editingUser.user_data.billing.plan_validity.expires_at)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: UserType["status"]) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="invited">Invitado</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="banned">Baneado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.name ||
                !formData.email ||
                (!editingUser && !formData.password.trim())
              }
            >
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
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
              Esta acción no se puede deshacer. El usuario {userToDelete?.name} será
              eliminado permanentemente del sistema.
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
