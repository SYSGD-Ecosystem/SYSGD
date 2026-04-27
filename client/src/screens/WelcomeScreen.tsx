import { Building2, LogIn, UserPlus } from "lucide-react";
import { useLicense } from "@/contexts/LicenseContext";
import { Button } from "@/components/ui/button";

export default function WelcomeScreen() {
	const { setSetupStep, hasAccount } = useLicense();

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
			<div className="fixed inset-0 z-[-1] pointer-events-none">
				<div className="absolute inset-0 bg-black opacity-50 pointer-events-none" />
				<div className="nebula pointer-events-none" />
			</div>

			<div className="w-full max-w-md text-center space-y-8">
				{/* Logo */}
				<div className="flex flex-col items-center gap-4">
					<div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/25">
						<Building2 className="w-10 h-10 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold text-white">SYSGD</h1>
						<p className="text-cyan-400">Gestión Empresarial</p>
					</div>
				</div>

				{/* Descripción */}
				<div className="space-y-2">
					<h2 className="text-2xl font-semibold text-white">
						Bienvenido
					</h2>
					<p className="text-gray-400">
						Gestiona tus documentos, proyectos y más desde tu escritorio
					</p>
				</div>

				{/* Botones */}
				<div className="space-y-4 pt-4">
					<Button
						onClick={() => setSetupStep("setup-account")}
						className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
					>
						<UserPlus className="w-5 h-5 mr-2" />
						Crear cuenta local
					</Button>

					{hasAccount && (
						<Button
							onClick={() => setSetupStep("license")}
							variant="outline"
							className="w-full h-12 text-lg border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10"
						>
							<LogIn className="w-5 h-5 mr-2" />
							Activar licencia
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
