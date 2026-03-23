import { useState, type FormEvent } from "react";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { useLicense } from "@/contexts/LicenseContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupAccountScreen() {
	const { setSetupStep, setLocalAccount } = useLicense();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		if (!name.trim()) {
			setError("El nombre es requerido");
			return;
		}

		if (!email.trim() || !email.includes("@")) {
			setError("Ingresa un correo válido");
			return;
		}

		if (password.length < 6) {
			setError("La contraseña debe tener al menos 6 caracteres");
			return;
		}

		if (password !== confirmPassword) {
			setError("Las contraseñas no coinciden");
			return;
		}

		setIsLoading(true);

		try {
			setLocalAccount({ name: name.trim(), email: email.trim().toLowerCase() });
			setSetupStep("license");
		} catch (err) {
			setError("Error al crear la cuenta");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
			<div className="fixed inset-0 z-[-1] pointer-events-none">
				<div className="absolute inset-0 bg-black opacity-50 pointer-events-none" />
				<div className="nebula pointer-events-none" />
			</div>

			<div className="w-full max-w-md">
				{/* Back button */}
				<button
					onClick={() => setSetupStep("welcome")}
					className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Volver
				</button>

				<div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 space-y-6">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-white">
							Crear cuenta local
						</h1>
						<p className="text-gray-400 text-sm mt-2">
							Esta cuenta se almacenará solo en este dispositivo
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="name" className="text-white/80">
								Nombre completo
							</Label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
								<Input
									id="name"
									type="text"
									placeholder="Tu nombre"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email" className="text-white/80">
								Correo electrónico
							</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
								<Input
									id="email"
									type="email"
									placeholder="correo@ejemplo.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password" className="text-white/80">
								Contraseña
							</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
								<Input
									id="password"
									type="password"
									placeholder="Mínimo 6 caracteres"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword" className="text-white/80">
								Confirmar contraseña
							</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
								<Input
									id="confirmPassword"
									type="password"
									placeholder="Repite tu contraseña"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
								/>
							</div>
						</div>

						{error && (
							<p className="text-red-400 text-sm text-center">{error}</p>
						)}

						<Button
							type="submit"
							disabled={isLoading}
							className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
						>
							{isLoading ? "Creando cuenta..." : "Continuar"}
						</Button>
					</form>

					<p className="text-xs text-gray-500 text-center">
						Tus datos se almacenan localmente y nunca se envían a servidores externos
					</p>
				</div>
			</div>
		</div>
	);
}
