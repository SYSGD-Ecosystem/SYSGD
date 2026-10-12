# Plan: catálogo de apps gestionado (web + admin + API)

## Motivación
La sección Aplicaciones de la web tiene links fijos y hay que editar código por
cada producto (ya hay versión Android + PC en camino). Pasa a catálogo: el admin
publica apps (icono a Supabase/S3 vía `POST /api/uploads` existente), cada app
tiene su página con SEO como Descubre (`useSeo` + slug), los usuarios
autenticados valoran/opinan, y cada app tiene artículos con categorías dinámicas.

## Decisión: modelo (tablas nuevas, migración `deploy-app-catalog.sql`)
- `apps`: slug UNIQUE, name, tagline, description, icon_url, platforms TEXT[],
  price_label, download_url, release_key (une con `app_releases.app_key` para
  versión/descarga vigente), is_published.
- `app_article_categories`: (app_id, slug) UNIQUE.
- `app_articles`: (app_id, slug) UNIQUE, category_id nullable, title, body (md),
  is_published.
- `app_reviews`: UNIQUE(app_id, user_id) — una valoración por usuario (editable),
  rating 1-5, comment. Promedio/count calculados al leer.

## Decisión: API (`/api/apps`, espejo de descubre: público + auth + isAdmin)
- Públicas: `GET /apps` (publicadas, con rating y release si hay `release_key`),
  `GET /apps/:slug` (404 si no publicada), `GET /apps/:slug/articles`,
  `GET /apps/:slug/articles/:articleSlug`.
- Auth: `POST /apps/:slug/reviews` (upsert propio), `DELETE .../reviews/mine`.
- Admin: CRUD `apps`, CRUD categorías, CRUD artículos, `GET .../reviews` +
  `DELETE /reviews/:id` (moderación).

## Decisión: admin (`/admin/catalogo`, build Vercel separado)
Una página con pestañas Apps (CRUD + subir icono vía uploads + publicar),
Artículos (por app + categorías dinámicas) y Reseñas (listar/borrar).

## Decisión: web
`AppsPage` lee `/api/apps` (fallback estático si falla); detalle
`/apps/:slug` con `useSeo`, widget de valoración (login si anónimo), artículos
por categoría; artículo en `/apps/:slug/articulos/:articleSlug`.

## Archivos
Server: `app-catalog.service.ts`, `app-catalog.controller.ts`,
`app-catalog.routes.ts`, `initDatabase.ts`, migración. Admin: tipos, hooks,
`catalogo/page.tsx`, ruta, sidebar. Web: `AppsPage`, `app-detail-page.tsx`,
`article-page.tsx`, rutas en `main.tsx`.
