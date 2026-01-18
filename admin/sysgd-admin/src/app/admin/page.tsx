import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, TrendingUp, Eye } from "lucide-react"

const stats = [
  {
    title: "Total Usuarios",
    value: "24",
    description: "3 nuevos esta semana",
    icon: Users,
  },
  {
    title: "Posts Publicados",
    value: "18",
    description: "5 publicados este mes",
    icon: FileText,
  },
  {
    title: "Visitas Totales",
    value: "1,284",
    description: "+12% vs mes anterior",
    icon: Eye,
  },
  {
    title: "Engagement",
    value: "89%",
    description: "+5% vs mes anterior",
    icon: TrendingUp,
  },
]

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración de SYSGD
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {[
                { action: "Nuevo usuario registrado", user: "Juan Pérez", time: "Hace 2 horas" },
                { action: "Post publicado", user: "María García", time: "Hace 5 horas" },
                { action: "Usuario actualizado", user: "Carlos López", time: "Hace 1 día" },
                { action: "Post editado", user: "Ana Martínez", time: "Hace 2 días" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Posts Destacados</CardTitle>
            <CardDescription>Los posts más vistos este mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {[
                { title: "Nuevo servicio de atención al cliente", views: 342 },
                { title: "Actualización de horarios 2024", views: 289 },
                { title: "Comunicado oficial de la dirección", views: 234 },
                { title: "Calendario de actividades", views: 187 },
              ].map((post, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <p className="text-sm font-medium text-foreground truncate flex-1 mr-4">
                    {post.title}
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {post.views} vistas
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
