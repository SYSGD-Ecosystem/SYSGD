export interface CatalogApp {
	id: string
	slug: string
	name: string
	tagline: string
	description: string
	icon_url: string
	platforms: string[]
	price_label: string
	download_url: string
	release_key: string | null
	is_published: boolean
	rating_avg: number
	rating_count: number
	release_version_name: string | null
	release_version_code: number | null
	release_download_url: string | null
	release_changelog: string | null
}

export interface CatalogArticle {
	id: string
	app_id: string
	category_id: string | null
	category_name: string | null
	category_slug: string | null
	slug: string
	title: string
	body: string
	is_published: boolean
	created_at: string
	updated_at: string
}

export interface CatalogReview {
	id: string
	app_id: string
	user_id: string
	rating: number
	comment: string
	created_at: string
	updated_at: string
	user_name: string
}
