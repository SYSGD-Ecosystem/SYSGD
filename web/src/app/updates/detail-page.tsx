import { useEffect, useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import ReactPlayer from "react-player"
import { ShareButtons } from "@/components/share-buttons"
import useUpdates from "@/hooks/useUpdates"
import { useSeo } from "@/hooks/useSeo"
import { buildPreview, stripMarkdown, toPublicSupabaseUrl } from "@/lib/format"
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Inbox,
	RefreshCw,
} from "lucide-react"
import { useState } from "react"

export default function UpdatesDetailPage() {
	const { id } = useParams<{ id: string }>()
	const { updates, loading, error, refetch } = useUpdates()

	useEffect(() => {
		window.scrollTo(0, 0)
	}, [id])

	const update = useMemo(
		() => (Array.isArray(updates) ? updates.find((item) => item.id === id) : undefined),
		[updates, id],
	)

	if (!id || (!loading && !error && !update)) {
		return <NotFoundState />
	}

	if (loading) return <LoadingState />
	if (error) return <ErrorState onRetry={refetch} />
	if (!update) return <NotFoundState />

	return <UpdateDetail update={update} />
}

function UpdateDetail({ update }: { update: NonNullable<ReturnType<typeof useUpdates>["updates"]>[number] }) {
	const [currentImage, setCurrentImage] = useState(0)
	const images = useMemo(
		() => (Array.isArray(update.screenshots) ? update.screenshots.map(toPublicSupabaseUrl) : []),
		[update.screenshots],
	)

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/updates/${update.id}`
			: ""
	const formattedDate = new Date(update.date).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	})

	useSeo({
		title: `${update.title} | SYSGD Actualizaciones`,
		description: stripMarkdown(update.description).slice(0, 200) || "Novedad de SYSGD",
		image: images[0] || "https://sysgd.netlify.app/og-image.png",
		url: shareUrl,
		type: "article",
	})

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
			<div className="py-10 md:py-16">
				<div className="container mx-auto px-4 md:px-6 max-w-4xl">
					<Link
						to="/updates"
						className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8"
					>
						<ArrowLeft className="w-4 h-4" />
						Volver a Actualizaciones
					</Link>

					<article>
						<div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
							<Calendar className="w-4 h-4" />
							Publicado el {formattedDate}
						</div>

						<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-balance">
							{update.title}
						</h1>

						{update.youtube_url && (
							<div className="aspect-video bg-muted rounded-xl overflow-hidden mb-8">
								<ReactPlayer width="100%" height="100%" src={update.youtube_url} />
							</div>
						)}

						{images.length > 0 && (
							<div className="mb-8">
								<div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted shadow-lg mb-4">
									<img
										src={images[currentImage]}
										alt={update.title}
										className="w-full h-full object-cover"
									/>
									{images.length > 1 && (
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
												onClick={() => setCurrentImage((currentImage + 1) % images.length)}
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

								{images.length > 1 && (
									<div className="flex gap-2 overflow-x-auto pb-1">
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
													alt={`${update.title} (${index + 1})`}
													loading="lazy"
													className="w-full h-full object-cover"
												/>
											</button>
										))}
									</div>
								)}
							</div>
						)}

						<div className="py-8 prose prose-gray dark:prose-invert max-w-none text-base md:text-lg">
							<ReactMarkdown>{update.description}</ReactMarkdown>
						</div>
					</article>

					<div className="my-8 p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
						<ShareButtons
							url={shareUrl}
							title={update.title}
							text={buildPreview(update.description, 100)}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

function LoadingState() {
	return (
		<div className="min-h-screen flex flex-col justify-center items-center gap-6">
			<div className="relative">
				<div className="w-20 h-20 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
			</div>
			<p className="text-lg font-semibold">Cargando actualización...</p>
		</div>
	)
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
	return (
		<div className="min-h-screen flex flex-col justify-center items-center gap-6 max-w-md mx-auto text-center px-4">
			<div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
				<AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
			</div>
			<h3 className="text-2xl font-bold">Oops, algo salió mal</h3>
			<button
				type="button"
				onClick={onRetry || (() => window.location.reload())}
				className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
			>
				<RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
				Reintentar
			</button>
		</div>
	)
}

function NotFoundState() {
	return (
		<div className="min-h-screen flex flex-col justify-center items-center gap-6 max-w-md mx-auto text-center px-4">
			<div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
				<Inbox className="w-10 h-10 text-gray-400" />
			</div>
			<h3 className="text-2xl font-bold">Actualización no encontrada</h3>
			<Link
				to="/updates"
				className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Ver todas las actualizaciones
			</Link>
		</div>
	)
}
