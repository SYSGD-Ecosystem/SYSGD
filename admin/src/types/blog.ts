export interface BlogPost {
	id: string
	slug: string
	title: string
	category: string
	cover_url: string
	body: string
	is_published: boolean
	created_at: string
	updated_at: string
}

export interface BlogPostPayload {
	slug?: string
	title: string
	category?: string
	coverUrl?: string
	body?: string
	isPublished?: boolean
}
