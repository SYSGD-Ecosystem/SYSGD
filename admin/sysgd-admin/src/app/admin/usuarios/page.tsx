import { useState, useMemo } from "react"

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
  Crown, 
  Edit, 
  Search, 
  Shield, 
  Trash2, 
  User, 
  UserPlus, 
  Users 
} from "lucide-react"
import { Button } from "../../../components/ui/button"

// Tipos basados en la estructura existente de SYSGD
interface UserData {
  billing: {
    tier: "free" | "pro" | "vip"
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

// Datos de ejemplo basados en la estructura real
const initialUsers: UserType[] = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan.perez@sysgd.com",
    privileges: "admin",
    status: "active",
    user_data: { billing: { tier: "vip" } },
  },
  {
    id: "2",
    name: "María García",
    email: "maria.garcia@sysgd.com",
    privileges: "user",
    status: "active",
    user_data: { billing: { tier: "pro" } },
  },
  {
    id: "3",
    name: "Carlos López",
    email: "carlos.lopez@sysgd.com",
    privileges: "user",
    status: "active",
    user_data: { billing: { tier: "free" } },
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana.martinez@sysgd.com",
    privileges: "user",
    status: "invited",
    user_data: { billing: { tier: "free" } },
  },
  {
    id: "5",
    name: "Roberto Sánchez",
    email: "roberto.sanchez@sysgd.com",
    privileges: "user",
    status: "suspended",
    user_data: { billing: { tier: "pro" } },
  },
  {
    id: "6",
    name: "Laura Torres",
    email: "laura.torres@sysgd.com",
    privileges: "admin",
    status: "active",
    user_data: { billing: { tier: "vip" } },
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    privileges: "user" as UserType["privileges"],
    status: "active" as UserType["status"],
    tier: "free" as UserData["billing"]["tier"],
  })

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const stats = useMemo(() => {
    const totalUsers = users.length
    const adminUsers = users.filter((user) => user.privileges === "admin").length
    const regularUsers = users.filter((user) => user.privileges === "user").length
    return { totalUsers, adminUsers, regularUsers }
  }, [users])

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
        privileges: user.privileges,
        status: user.status,
        tier: user.user_data.billing.tier,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: "",
        email: "",
        privileges: "user",
        status: "active",
        tier: "free",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingUser) {
      setUsers(
        users.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formData.name,
                email: formData.email,
                privileges: formData.privileges,
                status: formData.status,
                user_data: { billing: { tier: formData.tier } },
              }
            : u
        )
      )
    } else {
      const newUser: UserType = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        privileges: formData.privileges,
        status: formData.status,
        user_data: { billing: { tier: formData.tier } },
      }
      setUsers([...users, newUser])
    }
    setIsDialogOpen(false)
  }

  const handleDeleteClick = (user: UserType) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      setUsers(users.filter((u) => u.id !== userToDelete.id))
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
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administradores
            </CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              con privilegios de admin
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Regulares
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.regularUsers}</div>
            <p className="text-xs text-muted-foreground">usuarios estándar</p>
          </CardContent>
        </Card>
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
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Privilegios</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
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
                      <Badge
                        variant="outline"
                        className={getTierBadge(user.user_data.billing.tier).className}
                      >
                        {getTierBadge(user.user_data.billing.tier).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(user.status).variant}>
                        {getStatusBadge(user.status).label}
                      </Badge>
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          )}
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
            <Button onClick={handleSave} disabled={!formData.name || !formData.email}>
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
