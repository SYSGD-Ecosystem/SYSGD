import { useState, useEffect } from "react";
import { Copy, Check, KeyRound, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLicense } from "@/contexts/LicenseContext";

const ACTIVATION_URL = "https://work.ecosysgd.com";

// Helper: copia texto al portapapeles
// En Electron no hay menú contextual, así que todos los textos copiables
// necesitan su propio botón explícito.
async function copyToClipboard(text: string): Promise<void> {
	await navigator.clipboard.writeText(text);
}

export default function LicenseActivationScreen() {
	const { generateRequestCode, activateLicense, setSetupStep } = useLicense();

	const [step, setStep] = useState<"get-code" | "enter-key">("get-code");
	const [requestCode, setRequestCode] = useState("");
	const [licenseKey, setLicenseKey] = useState("");
	const [copiedCode, setCopiedCode] = useState(false);
	const [copiedKey, setCopiedKey] = useState(false);
	const [isActivating, setIsActivating] = useState(false);
	const [error, setError] = useState("");

	// Generar request code al montar la pantalla
	useEffect(() => {
		generateRequestCode()
			.then(setRequestCode)
			.catch((e) => console.error("Error generating request code:", e));
	}, [generateRequestCode]);

	const handleCopyCode = async () => {
		await copyToClipboard(requestCode);
		setCopiedCode(true);
		setTimeout(() => setCopiedCode(false), 2000);
	};

	const handleCopyKey = async () => {
		await copyToClipboard(licenseKey);
		setCopiedKey(true);
		setTimeout(() => setCopiedKey(false), 2000);
	};

	const handleOpenWeb = () => {
		if (window.electronAPI?.openExternal) {
			window.electronAPI.openExternal(ACTIVATION_URL);
		} else {
			// Fallback para navegador web normal
			window.open(ACTIVATION_URL, "_blank");
		}
	};

	const handleActivate = async () => {
		setError("");
		if (!licenseKey.trim()) {
			setError("Pega tu clave de licencia primero");
			return;
		}
		setIsActivating(true);
		const result = await activateLicense(licenseKey.trim());
		setIsActivating(false);
		if (!result.success) {
			setError(result.error ?? "Licencia inválida");
		}
		// Si tiene éxito el contexto cambia setupStep a "complete" automáticamente
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
			<div className="w-full max-w-md space-y-6">

				{/* Header */}
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setSetupStep("welcome")}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h1 className="text-2xl font-bold text-white flex items-center gap-2">
							<KeyRound className="w-6 h-6 text-cyan-400" />
							Activar licencia
						</h1>
						<p className="text-gray-400 text-sm">
							Sigue los pasos para activar tu acceso
						</p>
					</div>
				</div>

				{/* ── PASO 1: Copiar request code ─────────────────────────────────── */}
				<div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
					<div className="flex items-center gap-2">
						<span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
							1
						</span>
						<p className="text-white font-medium">
							Copia tu código de solicitud
						</p>
					</div>

					<p className="text-gray-400 text-sm pl-8">
						Este código identifica tu dispositivo de forma única. Pégalo en la
						web para generar tu licencia.
					</p>

					{/* Request code con botón de copiar */}
					<div className="bg-slate-900 rounded-lg p-3 border border-slate-600 space-y-2">
						<div className="flex items-start gap-2">
							<code className="flex-1 text-cyan-300 text-xs font-mono break-all leading-relaxed">
								{requestCode || "Generando código..."}
							</code>
							<Button
								size="sm"
								variant="ghost"
								onClick={handleCopyCode}
								disabled={!requestCode}
								className="flex-shrink-0 h-7 px-2"
								title="Copiar código"
							>
								{copiedCode ? (
									<Check className="w-3.5 h-3.5 text-green-400" />
								) : (
									<Copy className="w-3.5 h-3.5" />
								)}
							</Button>
						</div>
						{copiedCode && (
							<p className="text-green-400 text-xs pl-0">
								✓ Código copiado al portapapeles
							</p>
						)}
					</div>

					{/* Botón para abrir la web en el navegador del sistema */}
					<Button
						variant="outline"
						className="w-full border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
						onClick={handleOpenWeb}
						disabled={!requestCode}
					>
						<ExternalLink className="w-4 h-4 mr-2" />
						Ir a {ACTIVATION_URL}
					</Button>

					<p className="text-gray-500 text-xs text-center">
						Inicia sesión en la web, pega el código y elige tu plan
					</p>
				</div>

				{/* Botón para pasar al paso 2 */}
				{step === "get-code" && (
					<Button
						onClick={() => setStep("enter-key")}
						disabled={!requestCode}
						className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
					>
						Ya tengo mi clave →
					</Button>
				)}

				{/* ── PASO 2: Pegar license key ───────────────────────────────────── */}
				{step === "enter-key" && (
					<div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
						<div className="flex items-center gap-2">
							<span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
								2
							</span>
							<p className="text-white font-medium">
								Pega tu clave de licencia
							</p>
						</div>

						<p className="text-gray-400 text-sm pl-8">
							Copia la clave que aparece en la web después de completar el pago
							y pégala aquí.
						</p>

						{/* Textarea + botón de copiar lo que ya escribió (útil para verificar) */}
						<div className="relative">
							<textarea
								className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pr-10 text-cyan-300 font-mono text-sm resize-none focus:outline-none focus:border-cyan-500 placeholder-slate-600"
								rows={4}
								placeholder="Pega tu clave de licencia aquí..."
								value={licenseKey}
								onChange={(e) => {
									setLicenseKey(e.target.value);
									setError("");
								}}
							/>
							{licenseKey && (
								<button
									type="button"
									onClick={handleCopyKey}
									className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition-colors"
									title="Copiar clave"
								>
									{copiedKey ? (
										<Check className="w-4 h-4 text-green-400" />
									) : (
										<Copy className="w-4 h-4" />
									)}
								</button>
							)}
						</div>

						{error && (
							<Alert variant="destructive" className="py-2">
								<AlertDescription className="text-sm">{error}</AlertDescription>
							</Alert>
						)}

						<Button
							onClick={handleActivate}
							disabled={isActivating || !licenseKey.trim()}
							className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
						>
							{isActivating ? (
								<span className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									Verificando...
								</span>
							) : (
								"Activar licencia"
							)}
						</Button>

						<button
							type="button"
							onClick={() => setStep("get-code")}
							className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors"
						>
							← Volver al paso 1
						</button>
					</div>
				)}
			</div>
		</div>
	);
}