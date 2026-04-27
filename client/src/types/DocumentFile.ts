export interface DocumentFile {
	id: string;
	nombre: string;
	tipo:
		| "Registro de Entrada"
		| "Registro de Salida"
		| "Tabla de Retención"
		| "Cuadro de Clasificación";
	creador: string;
	fechaCreacion: string;
	ultimaModificacion: string;
	tamaño: string;
	estado: "Borrador" | "Revisión" | "Aprobado";
	tipo_item: "document";
}
