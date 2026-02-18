import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown"
import ReactPlayer from "react-player"

interface UpdateCardProps {
  update: {
    id: string;
    date: string;
    title: string;
    description: string;
    category: string;
    youtube_url?: string | null;
    screenshots?: string[];
  };
}

export function UpdateCard({ update }: UpdateCardProps) {
  const formattedDate = new Date(update.date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
        <p className="text-muted-foreground leading-relaxed mb-6">
          <ReactMarkdown>{update.description}</ReactMarkdown>
        </p>

        {update.youtube_url && (
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted mb-6">
            <ReactPlayer width="100%" height="100%" src={update.youtube_url} />
          </div>
        )}

        {update.screenshots && update.screenshots.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {update.screenshots.map((screenshot, index) => (
              <div
                key={index}
                className="relative aspect-video rounded-lg overflow-hidden bg-muted"
              >
                <img
                  src={screenshot || "/placeholder.svg"}
                  alt={`Screenshot ${index + 1} de ${update.title}`}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
