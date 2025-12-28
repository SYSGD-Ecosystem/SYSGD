import { useEffect, useState } from "react";
import type { RetentionScheduleData } from "../../types/RetentionSchedule";

const useGetRetentionSchedule = (archiveId: string) => {
	const [schedule, setSchedule] = useState<RetentionScheduleData[] | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const fetchData = async () => {
			try {
				if (!archiveId) throw new Error("Id vacío");
				const res = await fetch(
					`${serverUrl}/api/get-retention-schedule?id=${encodeURIComponent(archiveId)}`,
					{ credentials: "include" },
				);
				if (!res.ok) throw new Error("Error al obtener la TRD");
				const json = await res.json();
				const flat: RetentionScheduleData[] = Array.isArray(json)
					? json
							.filter((i) => Array.isArray(i.retention_schedule))
							.flatMap((i) => i.retention_schedule)
					: [];
				setSchedule(flat);
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} catch (e: any) {
				setError(e.message);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [archiveId, serverUrl]);

	return { schedule, error, loading };
};

export default useGetRetentionSchedule;
