import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, MessageCircle, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { DescubrePost } from "@/hooks/useDescubrePosts"

interface DescubrePostCardProps {
	post: DescubrePost
}

function formatPrice(precio: string, moneda: string): string {
	if (!precio) return "Consultar"
	if (moneda) return `${precio} ${moneda}`
	return precio
}

function formatWhatsAppUrl(contactNumber: string): string {
	const digits = contactNumber.replace(/\D/g, "")
	if (!digits) return ""
	return `https://wa.me/${digits}`
}

export function DescubrePostCard({ post }: DescubrePostCardProps) {
	const formattedDate = new Date(post.date).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	})

	const featuredImage = post.imageUrls?.[0]
	const whatsAppUrl = formatWhatsAppUrl(post.contactNumber)
	const priceLabel = formatPrice(post.precio, post.moneda)

	return (
		<Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
			{featuredImage && (
				<div className="relative aspect-[16/9] overflow-hidden bg-muted">
					<img
						src={featuredImage}
						alt={post.title}
						className="w-full h-full object-cover"
					/>
				</div>
			)}

			<div className="p-6 md:p-8 flex flex-col flex-1 gap-4">
				<div className="flex items-start justify-between gap-3 flex-wrap">
					<div className="flex items-center gap-2 flex-wrap">
						{post.category && <Badge variant="secondary">{post.category}</Badge>}
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Calendar className="w-4 h-4" />
							{formattedDate}
						</div>
					</div>
					<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold shrink-0">
						{priceLabel}
					</Badge>
				</div>

				<h3 className="text-xl md:text-2xl font-bold text-balance">{post.title}</h3>

				<div className="text-muted-foreground leading-relaxed text-sm md:text-base prose prose-sm dark:prose-invert max-w-none">
					<ReactMarkdown>{post.description}</ReactMarkdown>
				</div>

				<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-auto pt-4 border-t border-border/50">
					{post.userName && (
						<div className="flex items-center gap-1.5">
							<User className="w-4 h-4" />
							<span>{post.userName}</span>
						</div>
					)}
					{post.province && (
						<div className="flex items-center gap-1.5">
							<MapPin className="w-4 h-4" />
							<span>{post.province}</span>
						</div>
					)}
				</div>

				{whatsAppUrl && (
					<Button asChild className="w-full sm:w-auto mt-2">
						<a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
							<MessageCircle className="w-4 h-4 mr-2" />
							Contactar por WhatsApp
						</a>
					</Button>
				)}
			</div>
		</Card>
	)
}
