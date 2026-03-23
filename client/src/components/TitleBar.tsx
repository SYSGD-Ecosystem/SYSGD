import { ArrowLeft, ArrowRight, Minus, Square, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

export const TitleBar: React.FC = () => {
	const [isMaximized, setIsMaximized] = useState(false);

	useEffect(() => {
		const checkMaximized = async () => {
			if (window.electronAPI) {
				const maximized = await window.electronAPI.isMaximized();
				setIsMaximized(maximized);
			}
		};
		checkMaximized();
		const interval = setInterval(checkMaximized, 1000);
		return () => clearInterval(interval);
	}, []);

	const handleMinimize = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		window.electronAPI?.minimize();
	};

	const handleMaximize = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		window.electronAPI?.maximize();
		setIsMaximized((v) => !v);
	};

	const handleClose = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		window.electronAPI?.close();
	};

	if (!window.electronAPI) return null;

	return (
		<div
			className="
				flex items-center h-10 select-none z-50
				drag-region

				/* ── Modo claro: gradiente sky → azul suave ── */
				bg-gradient-to-r from-sky-100 via-blue-100 to-indigo-100
				border-b border-sky-300/50

				/* ── Modo oscuro: slate profundo → indigo → slate ── */
				dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900
				dark:border-b dark:border-indigo-500/20
			"
		>
			{/* Navegación */}
			<div className="flex no-drag-region">
				<button
					type="button"
					onClick={() => window.history.back()}
					className="
						h-10 w-12 flex items-center justify-center cursor-pointer
						text-sky-700 hover:text-sky-900 hover:bg-sky-200/60
						dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-500/20
						transition-all duration-150 no-drag-region
					"
					title="Atrás"
				>
					<ArrowLeft className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={() => window.history.forward()}
					className="
						h-10 w-12 flex items-center justify-center cursor-pointer
						text-sky-700 hover:text-sky-900 hover:bg-sky-200/60
						dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-500/20
						transition-all duration-150 no-drag-region
					"
					title="Adelante"
				>
					<ArrowRight className="w-4 h-4" />
				</button>
			</div>

			{/* Título — área de arrastre */}
			<div className="flex-1 flex items-center px-3 drag-region">
				<span
					className="
						text-sm font-semibold tracking-wide
						text-sky-900
						dark:bg-gradient-to-r dark:from-indigo-300 dark:to-cyan-300
						dark:bg-clip-text dark:text-transparent
					"
				>
					SYSGD Ecosystem
				</span>
			</div>

			{/* Controles de ventana */}
			<div className="flex no-drag-region">
				<button
					type="button"
					onClick={handleMinimize}
					className="
						h-10 w-12 flex items-center justify-center cursor-pointer
						text-sky-700 hover:text-sky-900 hover:bg-sky-200/60
						dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-500/20
						transition-all duration-150 no-drag-region
					"
					title="Minimizar"
				>
					<Minus className="w-4 h-4" />
				</button>

				<button
					type="button"
					onClick={handleMaximize}
					className="
						h-10 w-12 flex items-center justify-center cursor-pointer
						text-sky-700 hover:text-sky-900 hover:bg-sky-200/60
						dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-500/20
						transition-all duration-150 no-drag-region
					"
					title={isMaximized ? "Restaurar" : "Maximizar"}
				>
					<Square className="w-3 h-3" />
				</button>

				<button
					type="button"
					onClick={handleClose}
					className="
						h-10 w-12 flex items-center justify-center cursor-pointer
						text-sky-700 hover:text-white hover:bg-red-500
						dark:text-indigo-300 dark:hover:text-white dark:hover:bg-red-500/80
						transition-all duration-150 no-drag-region
					"
					title="Cerrar"
				>
					<X className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};