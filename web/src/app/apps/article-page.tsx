import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { MarkdownContent } from "@/components/markdown-content"
import { useSeo } from "@/hooks/useSeo"
import { useCatalogArticle } from "@/hooks/useAppCatalog"
import { ArrowLeft } from "lucide-react"

export default function AppArticlePage() {
	const { slug, articleSlug } = useParams<{ slug: string; articleSlug: string }>()
	const { article, loading, error } = useCatalogArticle(slug, articleSlug)

	useSeo({
		title: article ? `${article.title} | SYSGD Apps` : "Artículo | SYSGD",
		description: article?.body?.slice(0, 200) || "Artículo de aplicación SYSGD.",
		url: article ? `https://sysgd.netlify.app/apps/${slug}/articulos/${article.slug}` : undefined,
		type: "article",
	})

	if (loading) {
		return (
			<div className="py-24 text-center text-muted-foreground">Cargando artículo...</div>
		)
	}

	if (error || !article) {
		return (
			<div className="py-24 text-center">
				<p className="text-muted-foreground">No se encontró este artículo.</p>
				<Button asChild variant="outline" className="mt-4">
					<Link to={slug ? `/apps/${slug}` : "/apps"}>Volver</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="py-12 md:py-16">
			<div className="container mx-auto px-4 md:px-6 max-w-3xl">
				<Button asChild variant="ghost" size="sm" className="mb-6">
					<Link to={`/apps/${slug}`}>
						<ArrowLeft className="mr-2 h-4 w-4" /> Volver a la app
					</Link>
				</Button>
				<p className="text-sm text-muted-foreground">
					{article.category_name ?? "General"} · {new Date(article.created_at).toLocaleDateString()}
				</p>
				<h1 className="text-3xl md:text-4xl font-bold mt-2">{article.title}</h1>
				<div className="mt-6">
					<MarkdownContent text={article.body} />
				</div>
			</div>
		</div>
	)
}
