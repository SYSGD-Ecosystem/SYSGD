import { useEffect, useState } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export default function useUserCount() {
	const [count, setCount] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<null | string>(null);

	useEffect(() => {
		const fetchCount = async () => {
			try {
				const res = await fetch(`${serverUrl}/api/user-count`);
				if (!res.ok) throw new Error("Error al obtener la cantidad de usuarios");
				const data = await res.json();
				setCount(data.count);
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchCount();
	}, []);

	return { count, loading, error };
}
