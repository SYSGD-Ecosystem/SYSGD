import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export const getStatusIcon = (status: string, taskConfig?: any) => {
	// First try to find in dynamic config
	if (taskConfig?.states) {
		const stateConfig = taskConfig.states.find((s: any) => s.name === status);
		if (stateConfig) {
			// Return colored icon based on state config color
			const iconColor = stateConfig.color;
			switch (stateConfig.name.toLowerCase()) {
				case "completado":
					return (
						<CheckCircle className="w-4 h-4" style={{ color: iconColor }} />
					);
				case "en progreso":
					return <Clock className="w-4 h-4" style={{ color: iconColor }} />;
				case "pendiente":
					return (
						<AlertCircle className="w-4 h-4" style={{ color: iconColor }} />
					);
				default:
					return (
						<div
							className="w-4 h-4 rounded-full"
							style={{ backgroundColor: iconColor }}
						/>
					);
			}
		}
	}

	// Fallback to static icons
	switch (status) {
		case "Completada":
			return <CheckCircle className="w-4 h-4 text-green-500" />;

		case "En progreso":
			return <Clock className="w-4 h-4 text-blue-500" />;
		case "Pendiente":
			return <AlertCircle className="w-4 h-4 text-yellow-500" />;
		default:
			return null;
	}
};
