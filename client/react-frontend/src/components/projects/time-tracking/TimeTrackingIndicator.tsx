import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimeTrackingStore } from "@/store/time-tracking";
import { formatDuration, getEntryDurationSeconds } from "@/utils/time";

type TimeTrackingIndicatorProps = {
	onOpen?: () => void;
};

const TimeTrackingIndicator = ({ onOpen }: TimeTrackingIndicatorProps) => {
	const activeEntry = useTimeTrackingStore((state) => state.activeEntry);
	const now = useTimeTrackingStore((state) => state.now);

	if (!activeEntry) {
		return null;
	}

	const elapsedSeconds = getEntryDurationSeconds(activeEntry, now);
	const label =
		activeEntry.task_title ||
		activeEntry.project_name ||
		(activeEntry.task_id ? "Tarea" : "Tiempo general");

	return (
		<Button
			variant="outline"
			size="sm"
			className="hidden md:flex items-center gap-2"
			onClick={onOpen}
		>
			<Clock className="w-4 h-4" />
			<span className="text-xs font-semibold uppercase tracking-wide">
				{activeEntry.status === "paused" ? "Pausado" : "En curso"}
			</span>
			<span className="text-xs text-gray-500">{label}</span>
			<span className="text-xs font-mono">{formatDuration(elapsedSeconds)}</span>
		</Button>
	);
};

export default TimeTrackingIndicator;
