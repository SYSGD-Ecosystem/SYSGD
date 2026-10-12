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
	created_at: string
	updated_at: string
	release_version_name: string | null
	release_version_code: number | null
	release_download_url: string | null
	release_changelog: string | null
}

export interface CatalogAppsResponse {
	apps: CatalogApp[]
}

export interface AppCategory {
	id: string
	app_id: string
	name: string
	slug: string
}

export interface AppArticle {
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

export interface AppReview {
	id: string
	app_id: string
	user_id: string
	rating: number
	comment: string
	created_at: string
	updated_at: string
	user_name: string
}

export interface PublishAppPayload {
	slug?: string
	name: string
	tagline?: string
	description?: string
	iconUrl?: string
	platforms?: string[]
	priceLabel?: string
	downloadUrl?: string
	releaseKey?: string | null
	isPublished?: boolean
}

export interface ArticlePayload {
	categoryId?: string | null
	slug?: string
	title: string
	body?: string
	isPublished?: boolean
}
