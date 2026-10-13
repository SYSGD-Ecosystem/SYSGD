import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useBlogPosts } from "@/hooks/useBlog"

export default function BlogPage() {
	const { posts, loading } = useBlogPosts()
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

	const categories = useMemo(() => {
		const set = new Set<string>()
		for (const p of posts) {
			if (p.category) set.add(p.category)
		}
		return [...set]
	}, [posts])

	const visible = useMemo(
		() => (categoryFilter ? posts.filter((p) => p.category === categoryFilter) : posts),
		[posts, categoryFilter],
	)

	return (
		<div className="py-16 md:py-24">
			<div className="container mx-auto px-4 md:px-6 max-w-5xl">
				<div className="max-w-3xl mx-auto text-center mb-12">
					<h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Blog</h1>
					<p className="text-lg text-muted-foreground text-pretty">
						Ayudas, novedades y contenidos de SYSGD Ecosystem.
					</p>
				</div>

				{categories.length > 0 && (
					<div className="flex flex-wrap justify-center gap-2 mb-8">
						<Button
							size="sm"
							variant={categoryFilter === null ? "default" : "outline"}
							onClick={() => setCategoryFilter(null)}
						>
							Todo
						</Button>
						{categories.map((c) => (
							<Button
								key={c}
								size="sm"
								variant={categoryFilter === c ? "default" : "outline"}
								onClick={() => setCategoryFilter(c)}
							>
								{c}
							</Button>
						))}
					</div>
				)}

				{loading ? (
					<p className="text-center text-muted-foreground">Cargando publicaciones...</p>
				) : visible.length === 0 ? (
					<p className="text-center text-muted-foreground">Aún no hay publicaciones.</p>
				) : (
					<div className="grid gap-6 md:grid-cols-2">
						{visible.map((post) => (
							<Link key={post.id} to={`/blog/${post.slug}`}>
								<Card className="overflow-hidden h-full hover:border-primary transition-colors">
									{post.cover_url && (
										<img src={post.cover_url} alt="" className="h-44 w-full object-cover" />
									)}
									<div className="p-5">
										<p className="text-xs text-muted-foreground">
											{post.category || "General"} · {new Date(post.created_at).toLocaleDateString()}
										</p>
										<p className="font-semibold text-lg mt-1">{post.title}</p>
									</div>
								</Card>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
