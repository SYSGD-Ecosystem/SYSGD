import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api"; // Instancia centralizada

export interface OrgNode {
	name: string;
	title?: string;
	department?: string;
	children?: OrgNode[];
}

interface UseOrgReturn {
	data: OrgNode | null;
	loading: boolean;
	error: string | null;
	save: (tree: OrgNode) => Promise<void>;
	refetch: () => void;
}

export function useOrganizationChart(fileId: string): UseOrgReturn {
	const [data, setData] = useState<OrgNode | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchChart = useCallback(async () => {
		if (!fileId) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const response = await api.get<OrgNode>("/api/organization", {
				params: { id: fileId },
			});
			setData(response.data);
		} catch (e: any) {
			console.error("Error al obtener organigrama:", e);
			setError(e.response?.data?.message || e.message);
		} finally {
			setLoading(false);
		}
	}, [fileId]);

	useEffect(() => {
		fetchChart();
	}, [fetchChart]);

	const save = async (tree: OrgNode) => {
		try {
			await api.post("/api/organization", {
				id: fileId,
				data: tree,
			});
			setData(tree);
		} catch (e: any) {
			const errorMsg =
				e.response?.data?.message || "Error al guardar el organigrama";
			console.error(errorMsg);
			throw new Error(errorMsg);
		}
	};

	return { data, loading, error, save, refetch: fetchChart };
}
