import { CheckCircle } from "lucide-react";
import type { FC } from "react";
import { Button } from "../ui/button";

const Plans: FC = () => {
	return (
		<div className="flex flex-col h-screen bg-white bg-linear-to-br from-blue-500 to-white/20 dark:bg-slate-900">
			<header className="flex flex-col items-center justify-center m-10">
				<h1 className="text-white">SYSGD PROJECTS</h1>
				<h2 className="text-base text-white text-center">
					La planificación de tus proyectos e ideas comienza aquí. Seleccione un
					plan de usuario para continuar.
				</h2>
			</header>
			<main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-auto items-center justify-center h-full gap-4 p-5">
				<div className="bg-white  shadow flex flex-col gap-2 rounded-2xl border p-5 h-full bg-linear-to-br from-green-400/20 to-blue-600/20">
					<h3 className="text-lg">Plan de prueba por 30 días</h3>
					<div className="flex flex-col gap-2 h-full">
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">3 Proyectos permitidos</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">
								250 Tareas por proyecto permitidas
							</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">Modulo de Chat con agentes</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">
								Posibilidad de configuar tokens personales para agentes{" "}
							</span>
						</div>
					</div>
					<Button className="">0.00 USD Por un Mes</Button>
				</div>

				<div className="bg-white shadow  flex flex-col gap-2 rounded-2xl border p-5 h-full bg-linear-to-br from-violet-400/20 to-blue-600/20">
					<h3 className="text-lg">Plan Pro</h3>
					<div className="flex flex-col gap-2 h-full">
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">100 Proyectos permitidos</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">10000 Tareas por proyecto</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">Modulo de Chat con agentes</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">
								Posibilidad de configuar tokens personales para agentes{" "}
							</span>
						</div>
					</div>
					<Button className="">5.00 USD Por mes</Button>
				</div>

				<div className="bg-white shadow  flex flex-col gap-2 rounded-2xl border p-5 h-full bg-linear-to-br from-yellow-400/20 to-blue-600/20">
					<h3 className="text-lg">Plan Vip</h3>
					<div className="flex flex-col gap-2 h-full">
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">Proyectos ilimitados</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">Tareas ilimitadas</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">Modulo de Chat con agentes</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">
								Posibilidad de configuar tokens personales para agentes{" "}
							</span>
						</div>
					</div>
					<Button className="">12.00 USD Por Mes</Button>
				</div>

				<div className="bg-white shadow flex flex-col gap-2 rounded-2xl border p-5 h-full bg-linear-to-br from-red-500/20 to-blue-600/20">
					<h3 className="text-lg">Plan Nacional</h3>
					<div className="flex flex-col gap-2 h-full">
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">Disponible para los cubanos.</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">10 Proyectos</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">1000 Tareas por proyecto</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">Modulo de Chat con agentes</span>
						</div>
						<div className="flex items-center gap-3">
							<CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
							<span className="text-sm">
								Posibilidad de configuar tokens personales para agentes{" "}
							</span>
						</div>
					</div>
					<Button className="">100 CUP Por Mes</Button>
				</div>
			</main>
			<footer className="border-t mt-5 p-2 w-full flex items-center justify-center text-xs">
				© 2024-2026 SYSGD Ecosystem
			</footer>
		</div>
	);
};

export default Plans;
