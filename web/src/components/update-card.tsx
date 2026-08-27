import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { buildPreview, toPublicSupabaseUrl } from "@/lib/format";

export interface UpdateCardProps {
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
	const navigate = useNavigate();
	const formattedDate = new Date(update.date).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const preview = buildPreview(update.description, 200);

	return (
		<Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
			<div
				className="p-6 md:p-8 flex flex-col flex-1 gap-4 cursor-pointer"
				onClick={() => navigate(`/updates/${update.id}`)}
			>
				<div className="flex items-center gap-3 mb-4">
					<Badge variant="secondary">{update.category}</Badge>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Calendar className="w-4 h-4" />
						{formattedDate}
					</div>
				</div>

				<h3 className="text-2xl font-bold mb-3 text-balance line-clamp-2">
					{update.title}
				</h3>

				{preview && (
					<p className="text-muted-foreground leading-relaxed text-sm md:text-base line-clamp-4">
						{preview}
					</p>
				)}

				<Button
					variant="link"
					size="sm"
					className="self-start p-0 h-auto text-blue-600 dark:text-blue-400"
					onClick={(e) => {
						e.stopPropagation();
						navigate(`/updates/${update.id}`);
					}}
				>
					Leer más
					<ArrowRight className="w-4 h-4" />
				</Button>
			</div>

			{update.youtube_url && (
				<div className="aspect-video bg-muted overflow-hidden">
					<ReactPlayer width="100%" height="100%" src={update.youtube_url} />
				</div>
			)}

			{update.screenshots && update.screenshots.length > 0 && (
				<div className="grid gap-2 md:grid-cols-2 p-6">
					{update.screenshots.map((screenshot, index) => (
						<div
							key={index}
							className="relative aspect-video rounded-lg overflow-hidden bg-muted"
						>
							<img
								src={toPublicSupabaseUrl(screenshot)}
								alt={`Captura ${index + 1} de ${update.title}`}
								loading="lazy"
								className="object-cover"
							/>
						</div>
					))}
				</div>
			)}
		</Card>
	);
}
