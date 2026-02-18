import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface AccountingDocument {
	id: string;
	name: string;
	documentType: "tcp_income_expense";
	createdAt: string;
	updatedAt: string;
}

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
			setError("No se pudieron obtener los documentos contables");
			setDocuments([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchDocuments();
	}, [fetchDocuments]);

	const createDocument = async (name: string): Promise<AccountingDocument> => {
		const { data } = await api.post<AccountingDocument>("/api/accounting-documents", {
			name,
		});
		setDocuments((prev) => [data, ...prev]);
		return data;
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
