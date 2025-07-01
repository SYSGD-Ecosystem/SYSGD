import { useState, useEffect } from "react";

const useArchives = () => {
	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
	const [archives, setArchives] = useState([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(`${serverUrl}/api/archives`, {
					credentials: "include",
				});
				if (!response.ok) {
					throw new Error("Error al obtener los datos");
				}
				const data = await response.json();
				setArchives(data);
			} catch (error) {
				setError(JSON.stringify(error));
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [serverUrl]);

	return { archives, error, loading };
};

export default useArchives;
