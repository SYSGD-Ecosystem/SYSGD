import { ArrowLeft, ArrowRight, Minus, Square, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

export const TitleBar: React.FC = () => {
	const [isMaximized, setIsMaximized] = useState(false);
	const VISIVITILTY = false;

	useEffect(() => {
		// Verificar estado inicial de la ventana
		const checkMaximized = async () => {
			if (window.electronAPI) {
				const maximized = await window.electronAPI.isMaximized();
				setIsMaximized(maximized);
			}
		};

		checkMaximized();

		// Escuchar cambios de ventana (opcional, podrías agregar eventos desde main)
		const interval = setInterval(checkMaximized, 1000);

		return () => clearInterval(interval);
	}, []);

	const handleMinimize = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (window.electronAPI) {
			window.electronAPI.minimize();
		}
	};

	const handleMaximize = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (window.electronAPI) {
			window.electronAPI.maximize();
			setIsMaximized(!isMaximized);
		}
	};

	const handleClose = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (window.electronAPI) {
			window.electronAPI.close();
		}
	};

	// Solo mostrar en modo Electron
	if (!window.electronAPI) {
		return null;
	}

	if (VISIVITILTY) {
		return null;
	}

	return (
		<div className="flex items-center h-10 bg-linear-to-br from-slate-300 to-blue-400 dark:bg-slate-900 backdrop-blur-md border-b border-cyan-500/20 select-none drag-region z-50">
			<div className="flex no-drag-region">
				<button
					type="button"
					onClick={() => window.history.back()}
					className="h-10 w-12 flex items-center justify-center text-foreground hover:text-white hover:bg-slate-800/50 transition-all duration-200 no-drag-region cursor-pointer"
					title="Minimizar"
				>
					<ArrowLeft className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={() => window.history.forward()}
					className="h-10 w-12 flex items-center justify-center text-foreground hover:text-white hover:bg-slate-800/50 transition-all duration-200 no-drag-region cursor-pointer"
					title={isMaximized ? "Restaurar" : "Maximizar"}
				>
					<ArrowRight className="w-4 h-4" />
				</button>
			</div>
			{/* Área de arrastre (título) */}
			<div className="flex-1 flex items-center px-4 drag-region">
				<div className="flex items-center gap-3">
					<div>
						<span className="text-base font-bold text-foreground text-center w-full">
							SYSGD Ecosystem
						</span>
					</div>
				</div>
			</div>

			{/* Controles de ventana */}
			<div className="flex no-drag-region">
				<button
					type="button"
					onClick={handleMinimize}
					className="h-10 w-12 flex items-center justify-center text-foreground hover:text-white hover:bg-slate-800/50 transition-all duration-200 no-drag-region cursor-pointer"
					title="Minimizar"
				>
					<Minus className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={handleMaximize}
					className="h-10 w-12 flex items-center justify-center text-foreground hover:text-white hover:bg-slate-800/50 transition-all duration-200 no-drag-region cursor-pointer"
					title={isMaximized ? "Restaurar" : "Maximizar"}
				>
					<Square className="w-3 h-3" />
				</button>

				<button
					type="button"
					onClick={handleClose}
					className="h-10 w-12 flex items-center justify-center text-foreground hover:text-white hover:bg-red-500/80 transition-all duration-200 no-drag-region cursor-pointer"
					title="Cerrar"
				>
					<X className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};
