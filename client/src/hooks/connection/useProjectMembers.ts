import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Member } from "@/types/Member";

export const useProjectMembers = (projectId: string) => {
	const [members, setMembers] = useState<Member[]>([]);
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const response = await api.get<Member[]>(`/api/members/${projectId}`);

			setMembers(response.data);
			setError(false);
		} catch (err) {
			console.error("Error al obtener miembros:", err);
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return { members, error, loading, fetchMembers: fetchData };
};

type useInvitationsReturnType = {
	sendInvitation: (
		projectId: string,
		email: string,
		role: string,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;

	acceptInvitation: (
		invitationId: string,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;
};

export const useInvitations = (): useInvitationsReturnType => {
	const sendInvitation = async (
		projectId: string,
		email: string,
		role: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		try {
			await api.post(`/api/members/invite/${projectId}`, {
				email,
				role,
			});

			onSuccess();
		} catch (e) {
			console.error("Fallo al enviar invitación:", e);
			onFail();
		}
	};

	const acceptInvitation = async (
		invitationId: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		try {
			await api.post(`/api/members/accept-invite/${invitationId}`);
			onSuccess();
		} catch (e) {
			console.error("Fallo al aceptar invitación:", e);
			onFail();
		}
	};

	return { sendInvitation, acceptInvitation };
};
