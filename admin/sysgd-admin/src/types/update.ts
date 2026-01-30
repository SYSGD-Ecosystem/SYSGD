export type UpdateCategory =
	| "Nueva Funcionalidad"
	| "Mejora"
	| "Anuncio"
	| "Documentación"
	| "Seguridad"

export type UpdateItem = {
	id: string
	date: string
	title: string
	description: string
	category: UpdateCategory
	youtube_url?: string | null
}

export type CreateUpdateData = {
	title: string
	description: string
	category: UpdateCategory
	date: string
	youtube_url?: string | null
}

export type UpdateUpdateData = Partial<CreateUpdateData>
