export type Member = {
	id: string;
	name: string;
	role: string;
	email: string;
	tareasAsignadas: number;
	tareasCompletadas: number;
	estado: string;
	status?: string; // 'active' | 'invited'
	sender_name?: string; // Para invitaciones
	sender_email?: string; // Para invitaciones
	created_at?: string; // Para invitaciones
}