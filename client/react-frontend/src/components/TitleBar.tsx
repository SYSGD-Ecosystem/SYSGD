import { Minus, Square, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

export const TitleBar: React.FC = () => {
	const [isMaximized, setIsMaximized] = useState(false);

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
		console.log("Minimize button clicked");
		if (window.electronAPI) {
			window.electronAPI.minimize();
		}
	};

	const handleMaximize = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		console.log("Maximize button clicked");
		if (window.electronAPI) {
			window.electronAPI.maximize();
			setIsMaximized(!isMaximized);
		}
	};

	const handleClose = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		console.log("Close button clicked");
		if (window.electronAPI) {
			window.electronAPI.close();
		}
	};

	// Solo mostrar en modo Electron
	if (!window.electronAPI) {
		return null;
	}

	return (
		<div className="flex items-center justify-between h-10 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20 select-none drag-region">
			{/* Área de arrastre (título) */}
			<div className="flex-1 flex items-center px-4 drag-region">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
						<span className="text-white font-bold text-sm">S</span>
					</div>
					<div>
						<span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
							SYSGD
						</span>
						<div className="text-xs text-cyan-400">Ecosystem</div>
					</div>
				</div>
			</div>

			{/* Controles de ventana */}
			<div className="flex no-drag-region">
				<button
					onMouseDown={handleMinimize}
					className="h-10 w-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
					title="Minimizar"
				>
					<Minus className="w-4 h-4" />
				</button>

				<button
					onMouseDown={handleMaximize}
					className="h-10 w-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
					title={isMaximized ? "Restaurar" : "Maximizar"}
				>
					<Square className="w-3 h-3" />
				</button>

				<button
					onMouseDown={handleClose}
					className="h-10 w-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/80 transition-all duration-200"
					title="Cerrar"
				>
					<X className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};
