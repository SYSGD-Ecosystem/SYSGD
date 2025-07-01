import type { RegistroDeEntradaData } from "@/components/RegistroDeEntrada";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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
		data: RegistroDeEntradaData[],
		user_id: number,
		onSuccess: () => void,
		onFail: () => void,
	) => Promise<void>;
};

const useConnection = (): useConnectionReturnType => {
	const handleNewArchiving = async (
		code: string,
		company: string,
		name: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		try {
			const res = await fetch(
				`${serverUrl}/api/create`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ code, company, name }),
				},
			);
			if (res.ok) onSuccess();
			else {
				const text = await res.text();
				alert(text);
				onFail();
			}
		} catch {
			onFail();
		}
	};

	const handleAddClassificationBoxData = async (
		id: string,
		data: string,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		try {
			const res = await fetch(`${serverUrl}/api/add_classification_data`, {
				method: "POST", // 👈 Cambiar PUT por POST
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ id, data }), // 👈 Enviar ambos en el body
			});

			if (res.ok) onSuccess();
			else {
				const text = await res.text();
				console.error(text);
				onFail();
			}
		} catch (e) {
			console.error("Error al guardar:", e);
			onFail();
		}
	};

	const handleNewDocumentEntry = async (
		data: RegistroDeEntradaData[],
		user_id: number,
		onSuccess: () => void,
		onFail: () => void,
	) => {
		try {
			const res = await fetch(`${serverUrl}/api/document-entry`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ ...data, user_id }),
			});

			if (res.ok) onSuccess();
			else {
				const text = await res.text();
				console.error(text);
				onFail();
			}
		} catch (e) {
			console.error("Error al guardar el registro:", e);
			onFail();
		}
	};

	return { handleNewArchiving, handleAddClassificationBoxData, handleNewDocumentEntry };
};

export default useConnection;
