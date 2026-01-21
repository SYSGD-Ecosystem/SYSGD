import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Sparkles } from "lucide-react";

export function Hero() {
	return (
		<section className="relative h-screen overflow-hidden bg-linear-to-br from-blue-50 via-white to-blue-50">
			{/* Efectos de fondo */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent" />
			
			{/* Grid pattern */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f612_1px,transparent_1px),linear-gradient(to_bottom,#3b82f612_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

			<div className="container mx-auto px-4 md:px-6 h-full relative z-10">
				<div className="grid lg:grid-cols-2 gap-8 lg:gap-12 h-full items-center">
					
					{/* Panel Izquierdo - Logo y Título */}
					<div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-6">
						<div className="relative group">
							<div className="absolute -inset-1 bg-linear-to-r from-blue-500 to-blue-400 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-1000" />
							<img
								src="transparent.png"
								alt="SYSGD Logo"
								className="relative size-48 md:size-64 rounded-lg drop-shadow-2xl transform transition-transform duration-300 group-hover:scale-105"
							/>
						</div>

						<div className="space-y-4">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 text-sm font-medium">
								<Sparkles className="h-3 w-3" />
								<span>Beta Pública Disponible</span>
							</div>

							<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight text-gray-900">
								Sistema de Gestión{" "}
								<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-blue-500 to-blue-400">
									Modular
								</span>
							</h1>

							<p className="text-gray-600 text-base md:text-lg max-w-md mx-auto lg:mx-0">
								Ecosistema empresarial de código abierto
							</p>
						</div>
					</div>

					{/* Panel Derecho - Descripción y Acciones */}
					<div className="flex flex-col justify-center space-y-8 lg:pl-8">
						<div className="space-y-6">
							<div className="space-y-4">
								<h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
									Una plataforma que piensa en ti
								</h2>
								
								<p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-xl">
									Adaptable, personalizable y fácil de configurar. Gestión de proyectos y agentes de IA dedicados a cada tarea. Sin distracciones, solo productividad.
								</p>

								<p className="text-gray-700 text-base font-medium max-w-xl">
									Es hora de trabajar con tecnología que valora tu tiempo y te ayuda de verdad.
								</p>
							</div>

							<div className="flex flex-wrap gap-3 pt-2">
								<div className="flex items-center gap-2 text-sm text-gray-700">
									<div className="h-2 w-2 rounded-full bg-blue-500" />
									<span>Adaptable</span>
								</div>
								<div className="flex items-center gap-2 text-sm text-gray-700">
									<div className="h-2 w-2 rounded-full bg-purple-500" />
									<span>Agentes IA</span>
								</div>
								<div className="flex items-center gap-2 text-sm text-gray-700">
									<div className="h-2 w-2 rounded-full bg-green-500" />
									<span>Sin distracciones</span>
								</div>
							</div>
						</div>

						{/* Botones de acción */}
						<div className="flex flex-col sm:flex-row gap-3">
							<Button size="lg" className="group bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
								<a
									href="https://app.ecosysgd.com"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2"
								>
									<Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
									<span>Probar Ahora</span>
								</a>
							</Button>

							<Button size="lg" variant="outline" className="border-blue-500 text-blue-700 hover:bg-blue-50">
								<a href="/api" className="flex items-center gap-2">
									<span>Ver Planes</span>
									<ArrowRight className="h-4 w-4" />
								</a>
							</Button>

							<Button size="lg" variant="ghost" className="text-gray-700 hover:bg-blue-50">
								<a
									href="https://github.com/SYSGD-Ecosystem"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2"
								>
									<Github className="h-4 w-4" />
									<span>GitHub</span>
								</a>
							</Button>
						</div>

						{/* Advertencia Beta */}
						<div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
							<span className="text-amber-600 text-lg">⚠️</span>
							<div className="flex-1">
								<p className="text-sm text-amber-900 font-medium">
									Versión Beta
								</p>
								<p className="text-xs text-amber-700 mt-1">
									Pueden presentarse errores o comportamientos inesperados
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}