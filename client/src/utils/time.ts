import type { TimeEntry } from "@/types/TimeEntry";

export const formatDuration = (totalSeconds: number) => {
	const safeSeconds = Number.isFinite(totalSeconds) ? totalSeconds : 0;
	const hours = Math.floor(safeSeconds / 3600);
	const minutes = Math.floor((safeSeconds % 3600) / 60);
	const seconds = Math.floor(safeSeconds % 60);

	return [
		hours.toString().padStart(2, "0"),
		minutes.toString().padStart(2, "0"),
		seconds.toString().padStart(2, "0"),
	].join(":");
};

export const getEntryDurationSeconds = (
	entry: TimeEntry,
	nowMs = Date.now(),
) => {
	const baseDuration = entry.duration_seconds ?? 0;
	if (entry.status !== "running" || !entry.last_started_at) {
		return baseDuration;
	}

	const lastStartMs = new Date(entry.last_started_at).getTime();
	if (Number.isNaN(lastStartMs)) {
		return baseDuration;
	}

	const elapsedSeconds = Math.max(0, Math.floor((nowMs - lastStartMs) / 1000));
	return baseDuration + elapsedSeconds;
};

export const formatDateTime = (value?: string | null) => {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleString();
};
