import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "cu.lazaroysr96.sysgd",
	appName: "SYSGD",
	webDir: "dist",
	server: {
		androidScheme: "https",
	},
	plugins: {
		CapacitorHttp: {
			enabled: true,
		},
	},
};

export default config;
