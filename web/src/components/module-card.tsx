import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Circle } from "lucide-react"

interface ModuleCardProps {
  module: {
    id: string
    name: string
    description: string
    status: "completed" | "in-progress" | "planned"
    features: string[]
  }
}

const statusConfig = {
  completed: {
    label: "Completado",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-700 dark:text-green-400",
    iconColor: "text-green-600 dark:text-green-500",
  },
  "in-progress": {
    label: "En Desarrollo",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    iconColor: "text-yellow-600 dark:text-yellow-500",
  },
  planned: {
    label: "Planeado",
    icon: Circle,
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-600 dark:text-blue-500",
  },
}

export function ModuleCard({ module }: ModuleCardProps) {
  const config = statusConfig[module.status]
  const StatusIcon = config.icon

  return (
    <Card className="p-6 md:p-8 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${config.className} flex items-center justify-center`}>
          <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl md:text-2xl font-bold">{module.name}</h3>
            <Badge className={config.className}>{config.label}</Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed">{module.description}</p>
        </div>
      </div>

      {module.features.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Funcionalidades</h4>
          <ul className="space-y-2">
            {module.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5">•</span>
                <span className="flex-1 leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
