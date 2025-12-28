import { useCallback, useEffect, useState } from "react";
import type { Member } from "@/types/Member";
import { SERVER_URL } from "@/utils/util";

export const useProjectMembers = (projectId: string) => {
	const [members, setMembers] = useState<Member[]>([]);
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`${SERVER_URL}/api/members/${projectId}`, {
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error("feth members failed");
			}

			const data = await response.json();
			console.log(data);
			setMembers(data);
			setError(false);
		} catch (err) {
			console.error("get members failed", err);
			setError(true);
			setLoading(false);
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
			const res = await fetch(`${SERVER_URL}/api/members/invite/${projectId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, role }),
			});

			if (!res.ok) {
				onFail();
				throw new Error("fetch failed");
			}
			onSuccess();
		} catch (e) {
			console.error("failed invite", e);
			onFail();
		}
	};

	const acceptInvitation = async (
		invitationId: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		try {
			const res = await fetch(
				`${SERVER_URL}/api/members/accept-invite/${invitationId}`,
				{
					method: "POST",
					credentials: "include",
				},
			);

			if (!res.ok) {
				onFail();
				throw new Error("fetch failed");
			}
			onSuccess();
		} catch (e) {
			console.error("failed invite", e);
			onFail();
		}
	};

	return { sendInvitation, acceptInvitation };
};
