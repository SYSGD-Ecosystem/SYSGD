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
}

export type CreateUpdateData = {
	title: string
	description: string
	category: UpdateCategory
	date: string
}

export type UpdateUpdateData = Partial<CreateUpdateData>
