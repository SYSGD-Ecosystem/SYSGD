const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

type useProjectConnectionReturnType = {
	handleCreateProject: (
		name: string,
		description: string,
		onSuccess: () => void,
		onFail: () => void
	) => Promise<void>;
	handleUpdateProject: (
		id: string,
		data: Partial<{ name: string; description: string; status: string; visibility: string }>,
		onSuccess: () => void,
		onFail: () => void
	) => Promise<void>;
	handleDeleteProject: (
		id: string,
		onSuccess: () => void,
		onFail: () => void
	) => Promise<void>;
};

const useProjectConnection = (): useProjectConnectionReturnType => {
	return {
		handleCreateProject,
		handleUpdateProject,
		handleDeleteProject,
	};
};

const handleCreateProject = async (
	name: string,
	description: string,
	onSuccess: () => void,
	onFail: () => void,
) => {
	try {
		const res = await fetch(`${serverUrl}/api/projects`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ name, description }),
		});
		if (res.ok) onSuccess();
		else onFail();
	} catch (e) {
		console.error("Error al crear proyecto:", e);
		onFail();
	}
};

const handleUpdateProject = async (
	id: string,
	data: Partial<{ name: string; description: string; status: string; visibility: string }>,
	onSuccess: () => void,
	onFail: () => void,
) => {
	try {
		const res = await fetch(`${serverUrl}/api/projects/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (res.ok) onSuccess();
		else onFail();
	} catch (e) {
		console.error("Error al actualizar proyecto:", e);
		onFail();
	}
};

const handleDeleteProject = async (
	id: string,
	onSuccess: () => void,
	onFail: () => void,
) => {
	try {
		const res = await fetch(`${serverUrl}/api/projects/${id}`, {
			method: "DELETE",
			credentials: "include",
		});
		if (res.ok) onSuccess();
		else onFail();
	} catch (e) {
		console.error("Error al eliminar proyecto:", e);
		onFail();
	}
};


export default useProjectConnection;
