import { pool } from "../db";

export interface AppCatalogItem {
	id: string;
	slug: string;
	name: string;
	tagline: string;
	description: string;
	icon_url: string;
	platforms: string[];
	price_label: string;
	download_url: string;
	release_key: string | null;
	is_published: boolean;
	rating_avg: number;
	rating_count: number;
	created_at: string;
	updated_at: string;
	// Release vigente (si hay release_key enlazado).
	release_version_name: string | null;
	release_version_code: number | null;
	release_download_url: string | null;
	release_changelog: string | null;
}

export interface AppArticleCategory {
	id: string;
	app_id: string;
	name: string;
	slug: string;
}

export interface AppArticle {
	id: string;
	app_id: string;
	category_id: string | null;
	category_name: string | null;
	category_slug: string | null;
	slug: string;
	title: string;
	body: string;
	is_published: boolean;
	created_at: string;
	updated_at: string;
}

export interface AppReview {
	id: string;
	app_id: string;
	user_id: string;
	rating: number;
	comment: string;
	created_at: string;
	updated_at: string;
	user_name: string;
}

const APP_COLUMNS = `a.id, a.slug, a.name, a.tagline, a.description, a.icon_url,
	a.platforms, a.price_label, a.download_url, a.release_key, a.is_published,
	COALESCE((SELECT AVG(r.rating) FROM app_reviews r WHERE r.app_id = a.id), 0)::float AS rating_avg,
	(SELECT COUNT(*) FROM app_reviews r WHERE r.app_id = a.id)::int AS rating_count,
	a.created_at, a.updated_at,
	rel.version_name AS release_version_name,
	rel.version_code AS release_version_code,
	rel.download_url AS release_download_url,
	rel.changelog AS release_changelog`;

const APP_JOINS = `FROM apps a
	LEFT JOIN app_releases rel ON rel.app_key = a.release_key`;

export const slugify = (value: string): string =>
	value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);

export const listPublishedApps = async (): Promise<AppCatalogItem[]> => {
	const { rows } = await pool.query<AppCatalogItem>(
		`SELECT ${APP_COLUMNS} ${APP_JOINS}
		  WHERE a.is_published = true ORDER BY a.name ASC`,
	);
	return rows;
};

export const listAllApps = async (): Promise<AppCatalogItem[]> => {
	const { rows } = await pool.query<AppCatalogItem>(
		`SELECT ${APP_COLUMNS} ${APP_JOINS} ORDER BY a.name ASC`,
	);
	return rows;
};

export const getAppBySlug = async (
	slug: string,
	publishedOnly: boolean,
): Promise<AppCatalogItem | null> => {
	const { rows } = await pool.query<AppCatalogItem>(
		`SELECT ${APP_COLUMNS} ${APP_JOINS}
		  WHERE a.slug = $1 ${publishedOnly ? "AND a.is_published = true" : ""}`,
		[slug],
	);
	return rows[0] ?? null;
};

export interface UpsertAppInput {
	slug?: string;
	name: string;
	tagline?: string;
	description?: string;
	iconUrl?: string;
	platforms?: string[];
	priceLabel?: string;
	downloadUrl?: string;
	releaseKey?: string | null;
	isPublished?: boolean;
}

export const createApp = async (
	input: UpsertAppInput,
): Promise<AppCatalogItem> => {
	const slug = (input.slug ?? "").trim() || slugify(input.name);
	if (!slug) throw new Error("Slug inválido");
	await pool.query(
		`INSERT INTO apps (slug, name, tagline, description, icon_url, platforms,
		    price_label, download_url, release_key, is_published)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		[
			slug,
			input.name.trim(),
			input.tagline?.trim() ?? "",
			input.description?.trim() ?? "",
			input.iconUrl?.trim() ?? "",
			input.platforms ?? [],
			input.priceLabel?.trim() ?? "",
			input.downloadUrl?.trim() ?? "",
			input.releaseKey?.trim() || null,
			input.isPublished ?? false,
		],
	);
	const created = await getAppBySlug(slug, false);
	if (!created) throw new Error("No se pudo crear la app");
	return created;
};

export const updateApp = async (
	id: string,
	input: UpsertAppInput,
): Promise<AppCatalogItem | null> => {
	const current = await pool.query<{ slug: string }>(
		"SELECT slug FROM apps WHERE id = $1",
		[id],
	);
	if (current.rowCount === 0) return null;
	const slug = (input.slug ?? "").trim() || current.rows[0].slug;
	await pool.query(
		`UPDATE apps SET slug=$1, name=$2, tagline=$3, description=$4, icon_url=$5,
		    platforms=$6, price_label=$7, download_url=$8, release_key=$9,
		    is_published=$10, updated_at=NOW()
		  WHERE id=$11`,
		[
			slug,
			input.name.trim(),
			input.tagline?.trim() ?? "",
			input.description?.trim() ?? "",
			input.iconUrl?.trim() ?? "",
			input.platforms ?? [],
			input.priceLabel?.trim() ?? "",
			input.downloadUrl?.trim() ?? "",
			input.releaseKey?.trim() || null,
			input.isPublished ?? false,
			id,
		],
	);
	return getAppBySlug(slug, false);
};

export const deleteApp = async (id: string): Promise<boolean> => {
	const { rowCount } = await pool.query("DELETE FROM apps WHERE id = $1", [id]);
	return (rowCount ?? 0) > 0;
};

const getAppIdBySlug = async (slug: string): Promise<string | null> => {
	const { rows } = await pool.query<{ id: string }>(
		"SELECT id FROM apps WHERE slug = $1",
		[slug],
	);
	return rows[0]?.id ?? null;
};

export const listAppCategories = async (
	appId: string,
): Promise<AppArticleCategory[]> => {
	const { rows } = await pool.query<AppArticleCategory>(
		"SELECT id, app_id, name, slug FROM app_article_categories WHERE app_id = $1 ORDER BY name ASC",
		[appId],
	);
	return rows;
};

export const createAppCategory = async (
	appId: string,
	name: string,
	slug?: string,
): Promise<AppArticleCategory> => {
	const finalSlug = (slug ?? "").trim() || slugify(name);
	if (!finalSlug) throw new Error("Slug inválido");
	const { rows } = await pool.query<AppArticleCategory>(
		`INSERT INTO app_article_categories (app_id, name, slug)
		 VALUES ($1,$2,$3) RETURNING id, app_id, name, slug`,
		[appId, name.trim(), finalSlug],
	);
	return rows[0];
};

export const deleteAppCategory = async (
	categoryId: string,
): Promise<boolean> => {
	const { rowCount } = await pool.query(
		"DELETE FROM app_article_categories WHERE id = $1",
		[categoryId],
	);
	return (rowCount ?? 0) > 0;
};

const ARTICLE_COLUMNS = `ar.id, ar.app_id, ar.category_id,
	c.name AS category_name, c.slug AS category_slug,
	ar.slug, ar.title, ar.body, ar.is_published, ar.created_at, ar.updated_at`;
const ARTICLE_JOINS = `FROM app_articles ar
	LEFT JOIN app_article_categories c ON c.id = ar.category_id`;

export const listAppArticles = async (
	appSlug: string,
	publishedOnly: boolean,
	categorySlug?: string,
): Promise<AppArticle[]> => {
	const appId = await getAppIdBySlug(appSlug);
	if (!appId) return [];
	const filters = ["ar.app_id = $1"];
	const params: unknown[] = [appId];
	if (publishedOnly) filters.push("ar.is_published = true");
	if (categorySlug) {
		params.push(categorySlug);
		filters.push(`c.slug = $${params.length}`);
	}
	const { rows } = await pool.query<AppArticle>(
		`SELECT ${ARTICLE_COLUMNS} ${ARTICLE_JOINS}
		  WHERE ${filters.join(" AND ")} ORDER BY ar.created_at DESC`,
		params,
	);
	return rows;
};

export const getAppArticle = async (
	appSlug: string,
	articleSlug: string,
	publishedOnly: boolean,
): Promise<AppArticle | null> => {
	const appId = await getAppIdBySlug(appSlug);
	if (!appId) return null;
	const { rows } = await pool.query<AppArticle>(
		`SELECT ${ARTICLE_COLUMNS} ${ARTICLE_JOINS}
		  WHERE ar.app_id = $1 AND ar.slug = $2
		  ${publishedOnly ? "AND ar.is_published = true" : ""}`,
		[appId, articleSlug],
	);
	return rows[0] ?? null;
};

export interface UpsertArticleInput {
	categoryId?: string | null;
	slug?: string;
	title: string;
	body?: string;
	isPublished?: boolean;
}

export const createAppArticle = async (
	appId: string,
	input: UpsertArticleInput,
): Promise<AppArticle> => {
	const finalSlug = (input.slug ?? "").trim() || slugify(input.title);
	if (!finalSlug) throw new Error("Slug inválido");
	await pool.query(
		`INSERT INTO app_articles (app_id, category_id, slug, title, body, is_published)
		 VALUES ($1,$2,$3,$4,$5,$6)`,
		[
			appId,
			input.categoryId || null,
			finalSlug,
			input.title.trim(),
			input.body ?? "",
			input.isPublished ?? false,
		],
	);
	const { rows } = await pool.query<AppArticle>(
		`SELECT ${ARTICLE_COLUMNS} ${ARTICLE_JOINS}
		  WHERE ar.app_id = $1 AND ar.slug = $2`,
		[appId, finalSlug],
	);
	return rows[0];
};

export const updateAppArticle = async (
	articleId: string,
	input: UpsertArticleInput,
): Promise<AppArticle | null> => {
	const finalSlug = (input.slug ?? "").trim() || slugify(input.title);
	await pool.query(
		`UPDATE app_articles SET category_id=$1, slug=$2, title=$3, body=$4,
		    is_published=$5, updated_at=NOW()
		  WHERE id=$6`,
		[
			input.categoryId || null,
			finalSlug,
			input.title.trim(),
			input.body ?? "",
			input.isPublished ?? false,
			articleId,
		],
	);
	const { rows } = await pool.query<AppArticle>(
		`SELECT ${ARTICLE_COLUMNS} ${ARTICLE_JOINS} WHERE ar.id = $1`,
		[articleId],
	);
	return rows[0] ?? null;
};

export const deleteAppArticle = async (articleId: string): Promise<boolean> => {
	const { rowCount } = await pool.query(
		"DELETE FROM app_articles WHERE id = $1",
		[articleId],
	);
	return (rowCount ?? 0) > 0;
};

export const upsertAppReview = async (
	appId: string,
	userId: string,
	rating: number,
	comment: string,
): Promise<AppReview> => {
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		throw new Error("La valoración debe ser de 1 a 5");
	}
	const { rows } = await pool.query<AppReview>(
		`INSERT INTO app_reviews (app_id, user_id, rating, comment)
		 VALUES ($1,$2,$3,$4)
		 ON CONFLICT (app_id, user_id) DO UPDATE SET
		    rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
		 RETURNING id, app_id, user_id, rating, comment, created_at, updated_at,
		    (SELECT name FROM users WHERE id = $2) AS user_name`,
		[appId, userId, rating, comment.trim().slice(0, 2000)],
	);
	return rows[0];
};

export const deleteOwnAppReview = async (
	appId: string,
	userId: string,
): Promise<boolean> => {
	const { rowCount } = await pool.query(
		"DELETE FROM app_reviews WHERE app_id = $1 AND user_id = $2",
		[appId, userId],
	);
	return (rowCount ?? 0) > 0;
};

export const listAppReviews = async (appId: string): Promise<AppReview[]> => {
	const { rows } = await pool.query<AppReview>(
		`SELECT r.id, r.app_id, r.user_id, r.rating, r.comment, r.created_at,
		    r.updated_at, u.name AS user_name
		   FROM app_reviews r JOIN users u ON u.id = r.user_id
		  WHERE r.app_id = $1 ORDER BY r.created_at DESC LIMIT 200`,
		[appId],
	);
	return rows;
};

export const deleteAppReview = async (reviewId: string): Promise<boolean> => {
	const { rowCount } = await pool.query(
		"DELETE FROM app_reviews WHERE id = $1",
		[reviewId],
	);
	return (rowCount ?? 0) > 0;
};

export const getAppIdBySlugOrThrow = async (slug: string): Promise<string> => {
	const appId = await getAppIdBySlug(slug);
	if (!appId) throw new Error("App no encontrada");
	return appId;
};
