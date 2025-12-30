// vite.config.js
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
	const backendUrl = process.env.VITE_SERVER_URL || "http://localhost:3000";
	return {
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		server: {
			proxy: {
				"/api": {
					target: backendUrl,
					changeOrigin: true,
				},
			},
		},
		base: mode === "electron" ? "./" : "/", // relativo solo para Electron
	};
});
