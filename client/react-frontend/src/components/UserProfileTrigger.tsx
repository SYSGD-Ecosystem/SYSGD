import type { FC } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, ChevronDown } from "lucide-react"
import UserProfileDialog from "./UserProfileDialog"
import useCurrentUser from "../hooks/connection/useCurrentUser"

// Componente para usar como trigger personalizado en el header
const UserProfileTrigger: FC = () => {
  const { user, loading } = useCurrentUser()

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4 animate-pulse" />
      </Button>
    )
  }

  if (!user) {
    return (
      <UserProfileDialog
        trigger={
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Iniciar sesión</span>
          </Button>
        }
      />
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <UserProfileDialog
      trigger={
        <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.username}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      }
    />
  )
}

export default UserProfileTrigger
