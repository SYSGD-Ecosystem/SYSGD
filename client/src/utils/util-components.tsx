import {
	AlertCircle,
	CheckCircle,
	Circle,
	Clock,
	PauseCircle,
	PlayCircle,
	XCircle,
} from "lucide-react";
import type {
	TaskConfig,
	TaskStateIconName,
} from "@/components/projects/task-management/hooks/useTaskConfig";

const resolveIconNameFromStatus = (status: string): TaskStateIconName => {
	switch (status.trim().toLowerCase()) {
		case "completado":
		case "completada":
			return "check-circle";
		case "en progreso":
			return "clock";
		case "pendiente":
			return "alert-circle";
		case "cancelado":
		case "cancelada":
			return "x-circle";
		case "suspendido":
		case "pausado":
			return "pause-circle";
		default:
			return "circle";
	}
};

const renderIcon = (iconName: TaskStateIconName, color?: string) => {
	const className = "w-4 h-4";
	const style = color ? { color } : undefined;

	switch (iconName) {
		case "check-circle":
			return <CheckCircle className={className} style={style} />;
		case "clock":
			return <Clock className={className} style={style} />;
		case "pause-circle":
			return <PauseCircle className={className} style={style} />;
		case "x-circle":
			return <XCircle className={className} style={style} />;
		case "alert-circle":
			return <AlertCircle className={className} style={style} />;
		case "play-circle":
			return <PlayCircle className={className} style={style} />;
		case "circle":
		default:
			return <Circle className={className} style={style} />;
	}
};

export const getStatusIcon = (status: string, taskConfig?: TaskConfig | null) => {
	const stateConfig = taskConfig?.states?.find((state) => state.name === status);

	if (stateConfig) {
		const iconName = stateConfig.icon || resolveIconNameFromStatus(stateConfig.name);
		return renderIcon(iconName, stateConfig.color);
	}

	const fallbackIcon = resolveIconNameFromStatus(status);
	const fallbackColor =
		fallbackIcon === "check-circle"
			? "#22c55e"
			: fallbackIcon === "clock"
				? "#3b82f6"
				: fallbackIcon === "alert-circle"
					? "#eab308"
					: fallbackIcon === "x-circle"
						? "#ef4444"
						: fallbackIcon === "pause-circle"
							? "#6b7280"
							: "#9ca3af";

	return renderIcon(fallbackIcon, fallbackColor);
};
