import type React from "react";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	RefreshCw,
	Home,
	ArrowLeft,
	Wifi,
	Server,
	Clock,
	HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useServerStatus from "@/hooks/connection/useServerStatus";

interface ErrorServerProps {
	serverUrl?: string;
	errorCode?: string;
	errorMessage?: string;
	retryCount?: number;
	onRetry?: () => void;
}

const ErrorServer: React.FC<ErrorServerProps> = ({
	errorCode = "500",
	errorMessage = "Servidor no disponible",
	retryCount = 0,
	onRetry,
	serverUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin,
}) => {
	const navigate = useNavigate();
	const [isRetrying, setIsRetrying] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const [connectionStatus, setConnectionStatus] = useState<
		"checking" | "offline" | "online"
	>("checking");
	const { status: apiStatus, checkServerStatus } = useServerStatus(serverUrl);

	// Check API status and network connectivity
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const checkConnection = () => {
			setConnectionStatus(navigator.onLine ? "online" : "offline");
		};

		checkConnection();
		checkServerStatus();

		window.addEventListener("online", checkConnection);
		window.addEventListener("offline", checkConnection);

		return () => {
			window.removeEventListener("online", checkConnection);
			window.removeEventListener("offline", checkConnection);
		};
	}, [serverUrl, apiStatus]);

	// Auto-retry countdown
	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
		if (countdown === 0 && isRetrying) {
			handleRetry();
		}
	}, [countdown, isRetrying]);

	const handleRetry = async () => {
		setIsRetrying(true);

		try {
			// vuelve a consultar el endpoint de estado
			await checkServerStatus();

			if (apiStatus === "online") {
				if (onRetry) {
					onRetry();
				} else {
					// Default behavior: reload the page
					navigate("/login");
				}
			} else {
				// Mantenerse en la página de error
			}
		} catch (error) {
			console.error("Retry failed:", error);
		} finally {
			setIsRetrying(false);
		}
	};

	const startAutoRetry = () => {
		setCountdown(5);
		setIsRetrying(true);
	};

	const goHome = () => {
		navigate("/");
	};

	const goBack = () => {
		navigate(-1);
	};

	const getStatusColor = () => {
		switch (connectionStatus) {
			case "online":
				return "bg-green-500";
			case "offline":
				return "bg-red-500";
			default:
				return "bg-yellow-500";
		}
	};

	const getStatusText = () => {
		switch (connectionStatus) {
			case "online":
				return "Conectado";
			case "offline":
				return "Sin conexión";
			default:
				return "Verificando...";
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
			{/* Background Pattern */}
			{/* Background Pattern - Puntos con Tailwind */}
			<div
				className="absolute inset-0 opacity-10"
				style={{
					backgroundImage:
						"radial-gradient(circle, #ffffff 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>

			<div className="relative z-10 w-full max-w-2xl">
				{/* Main Error Card */}
				<Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700 shadow-2xl">
					<CardHeader className="text-center pb-4">
						{/* Animated Error Icon */}
						<div className="mx-auto mb-6 relative">
							<div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
								<AlertTriangle className="w-12 h-12 text-red-400 animate-bounce" />
							</div>
							<div className="absolute -top-2 -right-2">
								<Badge variant="destructive" className="animate-pulse">
									{errorCode}
								</Badge>
							</div>
						</div>

						<CardTitle className="text-3xl font-bold text-white mb-2">
							¡Oops! Algo salió mal
						</CardTitle>

						<p className="text-xl text-red-400 mb-4">{errorMessage}</p>

						<p className="text-slate-400 max-w-md mx-auto">
							No pudimos conectar con nuestros servidores. Esto puede ser
							temporal, por favor intenta nuevamente en unos momentos.
						</p>
					</CardHeader>

					<CardContent className="space-y-6">
						{/* Connection Status */}
						<Alert className="bg-slate-700/50 border-slate-600">
							<Wifi className="h-4 w-4" />
							<AlertDescription className="flex items-center justify-between">
								<span className="text-slate-300">Estado de conexión:</span>
								<div className="flex items-center gap-2">
									<div
										className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}
									/>
									<span className="text-white font-medium">
										{getStatusText()}
									</span>
								</div>
							</AlertDescription>
						</Alert>

						{/* Retry Information */}
						{retryCount > 0 && (
							<Alert className="bg-yellow-500/10 border-yellow-500/20">
								<Clock className="h-4 w-4 text-yellow-400" />
								<AlertDescription className="text-yellow-200">
									Intentos de reconexión: {retryCount}
								</AlertDescription>
							</Alert>
						)}

						<Separator className="bg-slate-700" />

						{/* Action Buttons */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<Button
								onClick={handleRetry}
								disabled={isRetrying}
								className="bg-blue-600 hover:bg-blue-700 text-white h-12"
							>
								{isRetrying ? (
									<>
										<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
										{countdown > 0
											? `Reintentando en ${countdown}s`
											: "Reintentando..."}
									</>
								) : (
									<>
										<RefreshCw className="w-4 h-4 mr-2" />
										Reintentar ahora
									</>
								)}
							</Button>

							<Button
								onClick={startAutoRetry}
								disabled={isRetrying}
								variant="outline"
								className="border-slate-600 text-slate-300 hover:bg-slate-700 h-12 bg-transparent"
							>
								<Server className="w-4 h-4 mr-2" />
								Auto-reintentar
							</Button>
						</div>

						{/* Navigation Options */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<Button
								onClick={goHome}
								variant="ghost"
								className="text-slate-300 hover:text-white hover:bg-slate-700 h-10"
							>
								<Home className="w-4 h-4 mr-2" />
								Ir al inicio
							</Button>

							<Button
								onClick={goBack}
								variant="ghost"
								className="text-slate-300 hover:text-white hover:bg-slate-700 h-10"
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Volver atrás
							</Button>
						</div>

						<Separator className="bg-slate-700" />

						{/* Help Section */}
						<div className="text-center space-y-3">
							<div className="flex items-center justify-center gap-2 text-slate-400">
								<HelpCircle className="w-4 h-4" />
								<span className="text-sm">¿Necesitas ayuda?</span>
							</div>

							<div className="flex flex-wrap justify-center gap-4 text-sm">
								<button
									type="button"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									Reportar problema
								</button>
								<button
									type="button"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									Estado del servicio
								</button>
								<button
									type="button"
									className="text-blue-400 hover:text-blue-300 underline"
								>
									Contactar soporte
								</button>
							</div>
						</div>

						{/* Technical Details (Collapsible) */}
						<details className="bg-slate-700/30 rounded-lg p-4">
							<summary className="text-slate-300 cursor-pointer hover:text-white">
								Detalles técnicos
							</summary>
							<div className="mt-3 space-y-2 text-sm text-slate-400 font-mono">
								<div>Error Code: {errorCode}</div>
								<div>Timestamp: {new Date().toISOString()}</div>
								<div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
								<div>Connection: {connectionStatus}</div>
								<div>Server URL: {serverUrl}</div>
							</div>
						</details>
					</CardContent>
				</Card>

				{/* Footer */}
				<div className="text-center mt-6 text-slate-500 text-sm">
					Si el problema persiste, por favor contacta a nuestro equipo de
					soporte
				</div>
			</div>
		</div>
	);
};

export default ErrorServer;
