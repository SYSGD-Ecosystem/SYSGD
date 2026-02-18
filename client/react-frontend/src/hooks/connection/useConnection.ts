import api from "@/lib/api"; // Tu instancia centralizada de Axios

type useConnectionReturnType = {
	handleNewArchiving: (
		code: string,
		company: string,
		name: string,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;
	handleAddClassificationBoxData: (
		id: string,
		data: string,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;
	handleNewDocumentEntry: (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;
	handleNewDocumentExit: (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;
	handleNewDocumentLoan: (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;
	handleNewTopographicRegister: (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;
	handleNewRetentionSchedule: (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;
};

const useConnection = (): useConnectionReturnType => {
	// Función genérica interna para evitar repetir el mismo try-catch 7 veces
	const postData = async (
		url: string,
		body: object,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		try {
			const res = await api.post(url, body);
			if (res.status === 200 || res.status === 201) {
				onSuccess();
			} else {
				onFail();
			}
		} catch (e: any) {
			console.error(`Error en ${url}:`, e.response?.data || e.message);
			onFail();
		}
	};

	const handleNewArchiving = async (
		code: string,
		company: string,
		name: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		await postData("/api/create", { code, company, name }, onSuccess, onFail);
	};

	const handleAddClassificationBoxData = async (
		id: string,
		data: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		await postData(
			"/api/add_classification_data",
			{ id, data },
			onSuccess,
			onFail,
		);
	};

	const handleNewDocumentEntry = async (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		await postData("/api/add-document-entry", { data, id }, onSuccess, onFail);
	};

	const handleNewDocumentExit = async (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		await postData("/api/add-document-exit", { data, id }, onSuccess, onFail);
	};

	const handleNewDocumentLoan = async (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		await postData("/api/add-document-loan", { data, id }, onSuccess, onFail);
	};

	const handleNewTopographicRegister = async (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		await postData(
			"/api/add-document-topographic",
			{ data, id },
			onSuccess,
			onFail,
		);
	};

	const handleNewRetentionSchedule = async (
		data: string,
		id: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		await postData(
			"/api/add-retention-schedule",
			{ data, id },
			onSuccess,
			onFail,
		);
	};

	return {
		handleNewArchiving,
		handleAddClassificationBoxData,
		handleNewDocumentEntry,
		handleNewDocumentExit,
		handleNewDocumentLoan,
		handleNewTopographicRegister,
		handleNewRetentionSchedule,
	};
};

export default useConnection;
