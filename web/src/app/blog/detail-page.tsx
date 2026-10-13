import { Link, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { useSeo } from "@/hooks/useSeo"
import { useBlogPost } from "@/hooks/useBlog"
import { ArrowLeft } from "lucide-react"

export default function BlogDetailPage() {
	const { slug } = useParams<{ slug: string }>()
	const { post, loading, error } = useBlogPost(slug)

	useSeo({
		title: post ? `${post.title} | Blog SYSGD` : "Blog | SYSGD",
		description: post?.body?.slice(0, 200) || "Ayudas y contenidos de SYSGD Ecosystem.",
		image: post?.cover_url || "https://sysgd.netlify.app/og-image.png",
		url: post ? `https://sysgd.netlify.app/blog/${post.slug}` : undefined,
		type: "article",
	})

	if (loading) {
		return (
			<div className="py-24 text-center text-muted-foreground">Cargando publicación...</div>
		)
	}

	if (error || !post) {
		return (
			<div className="py-24 text-center">
				<p className="text-muted-foreground">No se encontró esta publicación.</p>
				<Button asChild variant="outline" className="mt-4">
					<Link to="/blog">Volver al blog</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="py-12 md:py-16">
			<div className="container mx-auto px-4 md:px-6 max-w-3xl">
				<Button asChild variant="ghost" size="sm" className="mb-6">
					<Link to="/blog">
						<ArrowLeft className="mr-2 h-4 w-4" /> Blog
					</Link>
				</Button>
				{post.cover_url && (
					<img src={post.cover_url} alt="" className="w-full max-h-80 object-cover rounded-2xl mb-6" />
				)}
				<p className="text-sm text-muted-foreground">
					{post.category || "General"} · {new Date(post.created_at).toLocaleDateString()}
				</p>
				<h1 className="text-3xl md:text-4xl font-bold mt-2">{post.title}</h1>
				<div className="prose dark:prose-invert max-w-none mt-6">
					<ReactMarkdown>{post.body}</ReactMarkdown>
				</div>
			</div>
		</div>
	)
}
