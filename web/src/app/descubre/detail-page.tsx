import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { DescubrePostCard } from "@/components/descubre-post-card"
import { ShareButtons } from "@/components/share-buttons"
import useDescubrePosts, { type DescubrePost } from "@/hooks/useDescubrePosts"
import { useSeo } from "@/hooks/useSeo"
import { buildPreview, toPublicSupabaseUrls } from "@/lib/format"
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Inbox,
	MapPin,
	MessageCircle,
	RefreshCw,
	User,
} from "lucide-react"

export default function DescubrePostDetailPage() {
	const { id } = useParams<{ id: string }>()
	const { posts, loading, error, refetch } = useDescubrePosts()

	useEffect(() => {
		window.scrollTo(0, 0)
	}, [id])

	const post = useMemo(
		() => (Array.isArray(posts) ? posts.find((item) => item.id === id) : undefined),
		[posts, id],
	)

	if (!id || (!loading && !error && !post)) {
		return <NotFoundState />
	}

	if (loading) return <LoadingState />
	if (error) return <ErrorState onRetry={refetch} />
	if (!post) return <NotFoundState />

	return <PostDetail post={post} posts={posts} />
}

function formatPrice(precio: string, moneda: string): string {
	if (!precio) return "Consultar"
	if (moneda) return `${precio} ${moneda}`
	return precio
}

function formatWhatsAppUrl(contactNumber: string): string {
	const digits = contactNumber.replace(/\D/g, "")
	if (!digits) return ""
	return `https://wa.me/${digits}?text=${encodeURIComponent(
		"Hola, veo tu publicación en SYSGD Descubre: ",
	)}`
}

function PostDetail({ post, posts }: { post: DescubrePost; posts: DescubrePost[] }) {
	const images = useMemo(() => toPublicSupabaseUrls(post.imageUrls), [post.imageUrls])
	const [currentImage, setCurrentImage] = useState(0)

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/descubre/post/${post.id}`
			: ""
	const priceLabel = formatPrice(post.precio, post.moneda)
	const whatsAppUrl = formatWhatsAppUrl(post.contactNumber)
	const formattedDate = new Date(post.date).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	})

	const relatedPosts = useMemo(
		() =>
			posts
				.filter((item) => item.id !== post.id)
				.sort((a, b) => {
					const sameCategory = Number(b.category === post.category) - Number(a.category === post.category)
					return sameCategory || new Date(b.date).getTime() - new Date(a.date).getTime()
				})
				.slice(0, 3),
		[posts, post],
	)

	useSeo({
		title: `${post.title} | SYSGD`,
		description:
			buildPreview(post.description, 200) ||
			"Publicación de la comunidad SYSGD en Descubre.",
		image: images[0] || "https://sysgd.netlify.app/og-image.png",
		url: shareUrl,
		type: "article",
	})

	const hasMultipleImages = images.length > 1

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
			<div className="py-10 md:py-16">
				<div className="container mx-auto px-4 md:px-6 max-w-4xl">
					<Link
						to="/descubre"
						className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6"
					>
						<ArrowLeft className="w-4 h-4" />
						Volver a Descubre
					</Link>

					<article>
						{images.length > 0 && (
							<div className="mb-8">
								<div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted shadow-lg">
									<img
										src={images[currentImage]}
										alt={post.title}
										className="w-full h-full object-cover"
									/>
									{hasMultipleImages && (
										<>
											<button
												type="button"
												aria-label="Imagen anterior"
												onClick={() =>
													setCurrentImage(
														(currentImage - 1 + images.length) % images.length,
													)
												}
												className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
											>
												<ChevronLeft className="w-5 h-5" />
											</button>
											<button
												type="button"
												aria-label="Imagen siguiente"
												onClick={() =>
													setCurrentImage((currentImage + 1) % images.length)
												}
												className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
											>
												<ChevronRight className="w-5 h-5" />
											</button>
											<span className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-medium">
												{currentImage + 1} / {images.length}
											</span>
										</>
									)}
								</div>

								{hasMultipleImages && (
									<div className="flex gap-2 mt-3 overflow-x-auto pb-1">
										{images.map((image, index) => (
											<button
												key={image}
												type="button"
												onClick={() => setCurrentImage(index)}
												className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
													index === currentImage
														? "border-blue-600"
														: "border-transparent opacity-70 hover:opacity-100"
												}`}
											>
												<img
													src={image}
													alt={`${post.title} (${index + 1})`}
													loading="lazy"
													className="w-full h-full object-cover"
												/>
											</button>
										))}
									</div>
								)}
							</div>
						)}

						<div className="flex items-start justify-between gap-3 flex-wrap mb-4">
							<div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
								{post.category && (
									<span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-xs uppercase tracking-wide">
										{post.category}
									</span>
								)}
								<span className="inline-flex items-center gap-1.5">
									<Calendar className="w-4 h-4" />
									{formattedDate}
								</span>
								<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
									{priceLabel}
								</span>
							</div>
						</div>

						<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
							{post.title}
						</h1>

						<div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
							<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
								{post.userName && (
									<span className="inline-flex items-center gap-1.5">
										<User className="w-4 h-4" />
										{post.userName}
									</span>
								)}
								{post.province && (
									<span className="inline-flex items-center gap-1.5">
										<MapPin className="w-4 h-4" />
										{post.province}
									</span>
								)}
							</div>

							<ShareButtons
								url={shareUrl}
								title={post.title}
								text={buildPreview(post.description, 100)}
							/>
						</div>

						<div className="py-8 prose prose-gray dark:prose-invert max-w-none leading-relaxed text-base md:text-lg">
							<ReactMarkdown>{post.description}</ReactMarkdown>
						</div>

						{whatsAppUrl && (
							<div className="my-8 p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div>
									<h3 className="font-semibold text-gray-900 dark:text-gray-100">
										¿Te interesa esta publicación?
									</h3>
									<p className="text-sm text-muted-foreground mt-1">
										Contacta directamente con quien publicó a través de WhatsApp.
									</p>
								</div>
								<a
									href={whatsAppUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-md shrink-0"
								>
									<MessageCircle className="w-5 h-5" />
									Contactar por WhatsApp
								</a>
							</div>
						)}
					</article>

					{relatedPosts.length > 0 && (
						<section className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-12">
							<h2 className="text-2xl font-bold mb-8">También te puede interesar</h2>
							<div className="grid gap-6 md:grid-cols-3">
								{relatedPosts.map((item) => (
									<DescubrePostCard key={item.id} post={item} />
								))}
							</div>
						</section>
					)}

					<p className="mt-16 text-xs text-muted-foreground leading-relaxed text-center border-t border-gray-200 dark:border-gray-800 pt-8">
						Las publicaciones son creadas por usuarios de la comunidad. SYSGD actúa
						únicamente como proveedor tecnológico. Reporta contenido inapropiado a{" "}
						<a
							href="mailto:legal@ecosysgd.com"
							className="text-blue-600 dark:text-blue-400 underline font-medium"
						>
							legal@ecosysgd.com
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	)
}

function LoadingState() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex flex-col justify-center items-center gap-6">
			<div className="relative">
				<div className="w-20 h-20 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
			</div>
			<p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
				Cargando publicación...
			</p>
		</div>
	)
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex flex-col justify-center items-center gap-6 max-w-md mx-auto text-center px-4">
			<div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
				<AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
			</div>
			<h3 className="text-2xl font-bold">Oops, algo salió mal</h3>
			<p className="text-gray-600 dark:text-gray-400">
				No pudimos cargar esta publicación. Verifica tu conexión e intenta nuevamente.
			</p>
			<button
				type="button"
				onClick={onRetry || (() => window.location.reload())}
				className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all"
			>
				<RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
				Reintentar
			</button>
		</div>
	)
}

function NotFoundState() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex flex-col justify-center items-center gap-6 max-w-md mx-auto text-center px-4">
			<div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
				<Inbox className="w-10 h-10 text-gray-400" />
			</div>
			<h3 className="text-2xl font-bold">Publicación no encontrada</h3>
			<p className="text-gray-600 dark:text-gray-400">
				Puede que haya sido eliminada o que el enlace sea incorrecto.
			</p>
			<Link
				to="/descubre"
				className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Ir a Descubre
			</Link>
		</div>
	)
}
