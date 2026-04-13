export type ClientSource =
	| "main_web"
	| "sysgd_cont_web"
	| "sysgd_cont_android"
	| "admin_panel"
	| "unknown";

const CONTABILIDAD_SOURCES: ClientSource[] = ["sysgd_cont_web", "sysgd_cont_android"];

export const normalizeClientSource = (
	rawSource: string | string[] | undefined,
	fallback: ClientSource = "unknown",
): ClientSource => {
	const value = Array.isArray(rawSource) ? rawSource[0] : rawSource;
	const normalized =
		typeof value === "string"
			? value
					.split(",")[0]
					.trim()
					.toLowerCase()
			: "";

	switch (normalized) {
		case "main":
		case "main_web":
		case "react-frontend":
		case "client-react":
			return "main_web";
		case "web":
		case "sysgd_cont_web":
		case "sysgd-cont-web":
		case "cont_web":
			return "sysgd_cont_web";
		case "android":
		case "sysgd_cont_android":
		case "sysgd-cont-android":
		case "cont_android":
			return "sysgd_cont_android";
		case "admin":
		case "admin_panel":
		case "sysgd-admin":
			return "admin_panel";
		case "":
			return fallback;
		default:
			return "unknown";
	}
};

export const isContabilidadSource = (source: ClientSource): boolean =>
	CONTABILIDAD_SOURCES.includes(source);
