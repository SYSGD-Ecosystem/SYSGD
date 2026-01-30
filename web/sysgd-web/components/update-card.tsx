import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import Image from "next/image"

interface UpdateCardProps {
  update: {
    id: string
    date: string
    title: string
    description: string
    category: string
    screenshots?: string[]
  }
}

export function UpdateCard({ update }: UpdateCardProps) {
  const formattedDate = new Date(update.date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary">{update.category}</Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {formattedDate}
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-3 text-balance">{update.title}</h3>
        <p className="text-muted-foreground leading-relaxed mb-6">{update.description}</p>

        {update.screenshots && update.screenshots.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {update.screenshots.map((screenshot, index) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={screenshot || "/placeholder.svg"}
                  alt={`Screenshot ${index + 1} de ${update.title}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
