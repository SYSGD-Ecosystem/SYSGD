import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface AccountingDocument {
	id: string;
	name: string;
	documentType: "tcp_income_expense";
	createdAt: string;
	updatedAt: string;
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
	if (axios.isAxiosError(error)) {
		const responseMessage =
			typeof error.response?.data?.error === "string"
				? error.response.data.error
				: typeof error.response?.data?.message === "string"
					? error.response.data.message
					: null;

		if (responseMessage) return responseMessage;
		if (error.response?.status === 403) {
			return "No tienes acceso a esta función. Requiere plan Pro o VIP.";
		}
		if (error.response?.status === 401) {
			return "Tu sesión expiró. Inicia sesión nuevamente.";
		}
	}

	return fallback;
};

const useAccountingDocuments = () => {
	const [documents, setDocuments] = useState<AccountingDocument[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchDocuments = useCallback(async () => {
		setLoading(true);
		try {
			const { data } = await api.get<AccountingDocument[]>(
				"/api/accounting-documents",
			);
			setDocuments(data);
			setError(null);
		} catch (err) {
			setError(getApiErrorMessage(err, "No se pudieron obtener los documentos contables"));
			setDocuments([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchDocuments();
	}, [fetchDocuments]);

	const createDocument = async (name: string): Promise<AccountingDocument> => {
		try {
			const { data } = await api.post<AccountingDocument>("/api/accounting-documents", {
				name,
			});
			setDocuments((prev) => [data, ...prev]);
			return data;
		} catch (error) {
			throw new Error(
				getApiErrorMessage(error, "No se pudo crear el documento contable"),
			);
		}
	};

	return {
		documents,
		loading,
		error,
		reloadDocuments: fetchDocuments,
		createDocument,
	};
};

export default useAccountingDocuments;
