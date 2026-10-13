import { pool } from "../db";

export interface BlogPost {
	id: string;
	slug: string;
	title: string;
	category: string;
	cover_url: string;
	body: string;
	is_published: boolean;
	created_at: string;
	updated_at: string;
}

export interface UpsertBlogPostInput {
	slug?: string;
	title: string;
	category?: string;
	coverUrl?: string;
	body?: string;
	isPublished?: boolean;
}

const POST_COLUMNS = `id, slug, title, category, cover_url, body,
	is_published, created_at, updated_at`;

export const slugify = (value: string): string =>
	value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);

export const listPublishedPosts = async (): Promise<BlogPost[]> => {
	const { rows } = await pool.query<BlogPost>(
		`SELECT ${POST_COLUMNS} FROM blog_posts
		  WHERE is_published = true ORDER BY created_at DESC LIMIT 200`,
	);
	return rows;
};

export const listAllPosts = async (): Promise<BlogPost[]> => {
	const { rows } = await pool.query<BlogPost>(
		`SELECT ${POST_COLUMNS} FROM blog_posts ORDER BY created_at DESC LIMIT 500`,
	);
	return rows;
};

export const getPostBySlug = async (
	slug: string,
	publishedOnly: boolean,
): Promise<BlogPost | null> => {
	const { rows } = await pool.query<BlogPost>(
		`SELECT ${POST_COLUMNS} FROM blog_posts
		  WHERE slug = $1 ${publishedOnly ? "AND is_published = true" : ""}`,
		[slug],
	);
	return rows[0] ?? null;
};

export const createPost = async (
	input: UpsertBlogPostInput,
): Promise<BlogPost> => {
	const slug = (input.slug ?? "").trim() || slugify(input.title);
	if (!slug) throw new Error("Slug inválido");
	const { rows } = await pool.query<BlogPost>(
		`INSERT INTO blog_posts (slug, title, category, cover_url, body, is_published)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 RETURNING ${POST_COLUMNS}`,
		[
			slug,
			input.title.trim(),
			input.category?.trim() ?? "",
			input.coverUrl?.trim() ?? "",
			input.body ?? "",
			input.isPublished ?? false,
		],
	);
	return rows[0];
};

export const updatePost = async (
	id: string,
	input: UpsertBlogPostInput,
): Promise<BlogPost | null> => {
	const current = await pool.query<{ slug: string }>(
		"SELECT slug FROM blog_posts WHERE id = $1",
		[id],
	);
	if (current.rowCount === 0) return null;
	const slug = (input.slug ?? "").trim() || current.rows[0].slug;
	const { rows } = await pool.query<BlogPost>(
		`UPDATE blog_posts SET slug=$1, title=$2, category=$3, cover_url=$4,
		    body=$5, is_published=$6, updated_at=NOW()
		  WHERE id=$7
		 RETURNING ${POST_COLUMNS}`,
		[
			slug,
			input.title.trim(),
			input.category?.trim() ?? "",
			input.coverUrl?.trim() ?? "",
			input.body ?? "",
			input.isPublished ?? false,
			id,
		],
	);
	return rows[0] ?? null;
};

export const deletePost = async (id: string): Promise<boolean> => {
	const { rowCount } = await pool.query(
		"DELETE FROM blog_posts WHERE id = $1",
		[id],
	);
	return (rowCount ?? 0) > 0;
};
