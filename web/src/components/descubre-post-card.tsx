import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, MapPin, MessageCircle, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { DescubrePost } from "@/hooks/useDescubrePosts"
import { buildPreview, toPublicSupabaseUrl } from "@/lib/format"

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
	const navigate = useNavigate()
	const formattedDate = new Date(post.date).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	})

	const featuredImage = toPublicSupabaseUrl(post.imageUrls?.[0])
	const whatsAppUrl = formatWhatsAppUrl(post.contactNumber)
	const priceLabel = formatPrice(post.precio, post.moneda)
	const preview = buildPreview(post.description)

	const openDetail = () => navigate(`/descubre/post/${post.id}`)

	return (
		<Card
			onClick={openDetail}
			className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full cursor-pointer group"
		>
			{featuredImage && (
				<div className="relative aspect-[16/9] overflow-hidden bg-muted">
					<img
						src={featuredImage}
						alt={post.title}
						loading="lazy"
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

				<h3 className="text-xl md:text-2xl font-bold text-balance line-clamp-2">
					{post.title}
				</h3>

				{preview && (
					<p className="text-muted-foreground leading-relaxed text-sm md:text-base line-clamp-4">
						{preview}
					</p>
				)}

				<Button
					variant="outline"
					size="sm"
					className="w-fit mt-auto"
					onClick={(e) => {
						e.stopPropagation()
						openDetail()
					}}
				>
					Leer más
					<ArrowRight className="w-4 h-4" />
				</Button>

				<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border/50">
					{post.userName && (
						<div className="flex items-center gap-1.5 min-w-0">
							<User className="w-4 h-4 shrink-0" />
							<span className="truncate">{post.userName}</span>
						</div>
					)}
					{post.province && (
						<div className="flex items-center gap-1.5 shrink-0">
							<MapPin className="w-4 h-4" />
							<span>{post.province}</span>
						</div>
					)}
				</div>

				{whatsAppUrl && (
					<Button
						asChild
						variant="secondary"
						className="w-full sm:w-auto"
						onClick={(e) => e.stopPropagation()}
					>
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
