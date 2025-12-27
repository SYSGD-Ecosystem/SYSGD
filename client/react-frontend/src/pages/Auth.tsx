/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { type FC, type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterUser } from "@/hooks/connection/useRegisterUser";
import { useLogin } from "@/hooks/connection/useLogin";
import { useCheckUser } from "@/hooks/connection/useCheckUser";
import { useNavigate } from "react-router-dom";
import useServerStatus from "@/hooks/connection/useServerStatus";
import { useAuthSession } from "@/hooks/connection/useAuthSession";
import Loading from "@/components/Loading";
import LoadingLogo from "@/components/LoadingLogo";
import { Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

const Auth: FC = () => {
	const [isLoginPage, setIsLoginPage] = useState(true);
	const [password, setPassword] = useState("");
	const [repetPassword, setRepetPassword] = useState("");
	const [name, setName] = useState("");
	const [user, setUser] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [loginStep, setLoginStep] = useState<
		"email" | "password" | "complete" | "offer-register"
	>("email");
	const [invitedUserId, setInvitedUserId] = useState<string | null>(null);

	const router = useNavigate();

	const { register, loading, error, success } = useRegisterUser();
	const { login, error: loginError, loading: loginLoading, success: loginSuccess } = useLogin();
	const { checkUser, data: checkData, loading: checkingUser, error: checkError } = useCheckUser();

	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
	const { status, checkServerStatus } = useServerStatus(serverUrl);
	const { user: authUser, loading: loadingAuthUser } = useAuthSession();

	checkServerStatus();

	/* =======================
	   EFECTOS (ORDEN FIJO)
	======================= */

	// useEffect(() => {
	// 	checkServerStatus();
		
	// 	// Check for token in URL (Google OAuth callback)
	// 	const urlParams = new URLSearchParams(window.location.search);
	// 	const token = urlParams.get('token');
		
	// 	if (token) {
	// 		// Set the token as a cookie
	// 		// document.cookie = `token=${token}; path=/; max-age=86400; secure; samesite=none`;
	// 		// Clean the URL
	// 		// window.history.replaceState({}, document.title, window.location.pathname);
	// 		// Redirect to dashboard
	// 		router("/dashboard");
	// 	}
	// }, [checkServerStatus]);

	useEffect(() => {
		if (status === "offline") {
			router("/error");
		}
	}, [status, router]);

	useEffect(() => {
		if (authUser) {
			router("/dashboard");
		}
	}, [authUser, router]);

	useEffect(() => {
		if (loginSuccess) {
			router("/dashboard");
		}
	}, [loginSuccess, router]);

	useEffect(() => {
		if (!checkData) return;

		if (!checkData.exists) {
			setLoginStep("offer-register");
		} else if (checkData.status === "invited" && !checkData.hasPassword) {
			setInvitedUserId(checkData.id || null);
			setLoginStep("complete");
		} else if (checkData.exists && checkData.hasPassword) {
			setLoginStep("password");
		}
	}, [checkData]);

	/* =======================
	   HANDLERS
	======================= */

	const handleRegisterSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (password !== repetPassword) {
			alert("Las contraseñas no coinciden");
			return;
		}
		register({ name, email: user, password });
	};

	const handleLoginSubmit = async (e: FormEvent) => {
		e.preventDefault();

		if (loginStep === "email") {
			await checkUser(user);
			return;
		}

		if (loginStep === "password") {
			login({ email: user, password });
			return;
		}

		if (loginStep === "complete" && invitedUserId) {
			if (!name || !password || !confirmPassword) {
				alert("Por favor completa todos los campos");
				return;
			}
			if (password !== confirmPassword) {
				alert("Las contraseñas no coinciden");
				return;
			}
			try {
				const res = await fetch(`${serverUrl}/api/auth/complete-registration`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						userId: invitedUserId,
						name,
						password,
						email: user,
						confirmPassword,
					}),
				});
				if (res.ok) router("/dashboard");
			} catch {
				// feedback visual opcional
			}
		}
	};

	/* =======================
	   RETURNS SOLO UI
	======================= */

	if (status === "checking") {
		return (
			<div className="flex h-screen items-center justify-center bg-slate-900">
				<LoadingLogo />
			</div>
		);
	}

	if (loadingAuthUser) {
		return (
			<div className="flex h-screen flex-col items-center justify-center bg-slate-900">
				<Loading />
				<p className="text-white mt-4">Verificando sesión…</p>
			</div>
		);
	}

	/* =======================
	   UI NORMAL
	======================= */

	const getStepIcon = () => {
		switch (loginStep) {
			case "password": return <Lock className="w-5 h-5" />;
			case "complete": return <User className="w-5 h-5" />;
			case "offer-register": return <AlertCircle className="w-5 h-5" />;
			default: return <Mail className="w-5 h-5" />;
		}
	};

	const getStepTitle = () => {
		switch (loginStep) {
			case "password": return "Ingresa tu contraseña";
			case "complete": return "Completa tu registro";
			case "offer-register": return "Crear nueva cuenta";
			default: return "Ingresa tu correo";
		}
	};

	/* ⚠️
	   A partir de aquí tu JSX permanece igual
	   (login / register / Google button, etc.)
	   No lo toqué porque no era el problema.
	*/
	return (
		<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
			<div className="fixed inset-0 z-0">
				<div className="absolute inset-0 bg-black opacity-50" />
				<div className="nebula" />
			</div>
			
			{isLoginPage ? (
				<div className="w-full max-w-md relative bg-white/10 backdrop-blur-lg border border-white/20 overflow-hidden rounded-2xl px-8 py-8 flex items-center flex-col gap-6 shadow-2xl z-10">
					<div className="flex items-center flex-col justify-center gap-3">
						<div className="flex gap-2 items-center justify-center">
							<h1 className="text-3xl font-bold text-white">SYSGD</h1>
						</div>
						<div className="flex items-center justify-between w-full">
							<div className="text-white/60 text-sm">
								Paso {loginStep === "email" ? "1" : loginStep === "password" ? "2" : "2"} de 2
							</div>
							{loginStep !== "email" && (
								<button
									type="button"
									onClick={() => setLoginStep("email")}
									className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
									</svg>
									Regresar
								</button>
							)}
						</div>
						<div className="flex items-center gap-2 text-white/80">
							{getStepIcon()}
							<p className="text-lg">{getStepTitle()}</p>
						</div>
					</div>

					<form onSubmit={handleLoginSubmit} className="flex flex-col gap-5 w-full">
						<div className="space-y-2">
							<Label htmlFor="user" className="text-white/80 text-sm">Correo electrónico</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
								<Input
									placeholder="correo@ejemplo.com"
									id="user"
									type="email"
									value={user}
									onChange={(e) => setUser(e.target.value)}
									className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
								/>
							</div>
						</div>

						{loginStep === "password" && (
							<div className="space-y-2">
								<Label htmlFor="password" className="text-white/80 text-sm">Contraseña</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
									<Input
										id="password"
										type="password"
										placeholder="Tu contraseña"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
									/>
								</div>
							</div>
						)}

						{loginStep === "complete" && (
							<>
								<div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
									<CheckCircle className="w-5 h-5 text-green-400" />
									<p className="text-sm text-green-100">Hemos encontrado una invitación para este correo. Completa tus datos para activar tu cuenta.</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="name-complete" className="text-white/80 text-sm">Nombre completo</Label>
									<div className="relative">
										<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
										<Input 
											id="name-complete" 
											type="text" 
											value={name} 
											onChange={(e) => setName(e.target.value)} 
											className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
											placeholder="Tu nombre"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password-complete" className="text-white/80 text-sm">Crear contraseña</Label>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
										<Input 
											id="password-complete" 
											type="password" 
											value={password} 
											onChange={(e) => setPassword(e.target.value)} 
											className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
											placeholder="Crea una contraseña segura"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirm-password-complete" className="text-white/80 text-sm">Confirmar contraseña</Label>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
										<Input 
											id="confirm-password-complete" 
											type="password" 
											value={confirmPassword} 
											onChange={(e) => setConfirmPassword(e.target.value)} 
											className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
											placeholder="Confirma tu contraseña"
										/>
									</div>
								</div>
							</>
						)}

						{loginStep === "offer-register" && (
							<div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
								<AlertCircle className="w-5 h-5 text-blue-400" />
								<p className="text-sm text-blue-100">No encontramos una cuenta con este correo. ¿Deseas crear una cuenta nueva?</p>
							</div>
						)}

						{loginStep === "offer-register" ? (
							<>
								<Button
									type="button"
									onClick={() => setIsLoginPage(false)}
									className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 transition-all duration-200 shadow-lg hover:shadow-xl"
								>
									Crear cuenta nueva
								</Button>
								<div className="text-center text-white/60">
									<button
										type="button"
										onClick={() => setLoginStep("email")}
										className="text-blue-400 hover:text-blue-300 underline text-sm transition-colors"
									>
										Regresar y probar otro correo
									</button>
								</div>
							</>
						) : (
							<Button
								type="submit"
								disabled={
									(loginStep === "email" && (user === "" || checkingUser)) ||
									(loginStep === "password" && (password === "" || loginLoading)) ||
									(loginStep === "complete" && (!name || !password || !confirmPassword || loginLoading))
								}
								className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 transition-all duration-200 shadow-lg hover:shadow-xl"
							>
								{checkingUser || loginLoading ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
										Procesando...
									</>
								) : loginStep === "email" ? "Continuar" :
								 loginStep === "password" ? "Iniciar sesión" :
								 loginStep === "complete" ? "Completar registro" :
								 "Crear cuenta"}
							</Button>
						)}

						{loginError && (
							<div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
								<p className="text-red-200 text-sm text-center">{loginError}</p>
							</div>
						)}
						{checkError && (
							<div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
								<p className="text-red-200 text-sm text-center">{checkError}</p>
							</div>
						)}
					</form>

					<div className="w-full flex items-center justify-center gap-2">
						<div className="flex-1 h-px bg-white/20" />
						<span className="text-xs text-white/50 whitespace-nowrap">O CONTINUA CON</span>
						<div className="flex-1 h-px bg-white/20" />
					</div>

					<ButtonGoogle />

					<div className="text-center text-sm text-white/60">
						{loginStep === "offer-register" ? (
							<button
								type="button"
								onClick={() => setIsLoginPage(false)}
								className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
							>
								Crear cuenta manualmente
							</button>
						) : (
							<>
								¿No tienes una cuenta?{" "}
								<button
									type="button"
									onClick={() => setIsLoginPage(false)}
									className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
								>
									Crear cuenta
								</button>
							</>
						)}
					</div>
				</div>
			) : (
				<div className="w-full max-w-md relative bg-white/10 backdrop-blur-lg border border-white/20 overflow-hidden rounded-2xl px-8 py-8 flex items-center flex-col gap-6 shadow-2xl z-10">
					<div className="flex items-center flex-col justify-center gap-3">
						<div className="flex gap-2 items-center justify-center">
							<h1 className="text-3xl font-bold text-white">SYSGD</h1>
						</div>
						<p className="text-lg text-white/80">Crear cuenta nueva</p>
					</div>

					<form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5 w-full">
						<div className="space-y-2">
							<Label htmlFor="name" className="text-white/80 text-sm">Nombre completo</Label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
								<Input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
									placeholder="Tu nombre completo"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email" className="text-white/80 text-sm">Correo electrónico</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
								<Input
									id="email"
									type="email"
									value={user}
									onChange={(e) => setUser(e.target.value)}
									className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
									placeholder="correo@ejemplo.com"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="register-password" className="text-white/80 text-sm">Contraseña</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
								<Input
									id="register-password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
									placeholder="Crea una contraseña segura"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirm-password" className="text-white/80 text-sm">Confirmar contraseña</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
								<Input
									id="confirm-password"
									type="password"
									value={repetPassword}
									onChange={(e) => setRepetPassword(e.target.value)}
									className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
									placeholder="Repite tu contraseña"
								/>
							</div>
						</div>

						<Button
							type="submit"
							disabled={loading || password === "" || user === "" || name === ""}
							className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 transition-all duration-200 shadow-lg hover:shadow-xl"
						>
							{loading ? (
								<>
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
									Registrando...
								</>
							) : "Crear cuenta"}
						</Button>

						{error && (
							<div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
								<p className="text-red-200 text-sm text-center">{error}</p>
							</div>
						)}
						{success && (
							<div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
								<p className="text-green-200 text-sm text-center">¡Usuario registrado con éxito!</p>
							</div>
						)}
					</form>

					<p className="text-xs text-white/50 text-center mt-2">
						Al registrarte, aceptas nuestros{" "}
						<a
							href="/terms"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:text-blue-300 underline transition-colors"
						>
							Términos y Condiciones
						</a>{" "}
						y nuestra{" "}
						<a
							href="/privacy"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:text-blue-300 underline transition-colors"
						>
							Política de Privacidad
						</a>
						.
					</p>

					<div className="w-full flex items-center justify-center gap-2">
						<div className="flex-1 h-px bg-white/20" />
						<span className="text-xs text-white/50 whitespace-nowrap">O CONTINUA CON</span>
						<div className="flex-1 h-px bg-white/20" />
					</div>

					<ButtonGoogle />

					<div className="text-center text-sm text-white/60">
						¿Ya tienes cuenta?{" "}
						<button
							type="button"
							onClick={() => setIsLoginPage(true)}
							className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
						>
							Iniciar sesión
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

const ButtonGoogle: FC = () => {
	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

	return (
		<button
			type="button"
			onClick={() => {
				window.location.href = `${serverUrl}/api/auth/google`;
			}}
			className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 rounded-lg flex items-center justify-center text-white font-medium cursor-pointer transition-all duration-200"
		>
			<svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				/>
				<path
					fill="currentColor"
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				/>
				<path
					fill="currentColor"
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				/>
				<path
					fill="currentColor"
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				/>
			</svg>
			Continuar con Google
		</button>
	);
};

export default Auth;
