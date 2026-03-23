// Tipos globales para detección de entorno
declare global {
	interface Window {
		process?: {
			versions?: {
				electron?: string;
				node?: string;
				chrome?: string;
			};
			type?: string;
		};
		electronAPI?: {
			appReady: () => void;
			minimize: () => void;
			maximize: () => void;
			unmaximize: () => void;
			close: () => void;
			isMaximized: () => Promise<boolean>;
			isDev: () => boolean;
		};
		Capacitor?: any;
		capacitor?: any;
	}
}

export {};
