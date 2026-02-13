import { type FC, type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "@/components/Loading";
import LoadingLogo from "@/components/LoadingLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthSession } from "@/hooks/connection/useAuthSession";
import { useLogin } from "@/hooks/connection/useLogin";
import { useRegisterUser } from "@/hooks/connection/useRegisterUser";
import useServerStatus from "@/hooks/connection/useServerStatus";

const Login: FC = () => {
	const [isLoginPage, setIsLoginPage] = useState(true);
	const router = useNavigate();
	const [password, setPassword] = useState("");
	const [repetPassword, setRepetPassword] = useState("");
	const [name, setName] = useState("");
	const [user, setUser] = useState("");

	const { register, loading, error, success } = useRegisterUser();
	const {
		login,
		error: loginError,
		loading: loginLoading,
		success: loginSuccess,
	} = useLogin();

	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
	const { status, checkServerStatus } = useServerStatus(serverUrl);
	const { user: authUser, loading: loadingAuthUser } = useAuthSession();

	useEffect(() => {
		checkServerStatus();

		// Check for token in URL (Google OAuth callback)
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get("token");

		if (token) {
			// Set the token as a cookie
			document.cookie = `token=${token}; path=/; max-age=86400; secure; samesite=none`;
			// Clean the URL
			window.history.replaceState({}, document.title, window.location.pathname);
			// Redirect to dashboard
			router("/dashboard");
		}
	}, [checkServerStatus, router]);

	useEffect(() => {
		if (loginSuccess) {
			router("/dashboard");
		}
	}, [loginSuccess, router]);

	useEffect(() => {
		if (!success) return;

		const token = localStorage.getItem("token");
		if (token) {
			router("/dashboard");
			return;
		}

		setIsLoginPage(true);
		setPassword("");
		setRepetPassword("");
	}, [success, router]);

	const handleRegisterSubmit = (e: FormEvent) => {
		e.preventDefault();

		if (password !== repetPassword) {
			alert("Las contraseñas no coinciden");
			return;
		}

		register({ name, email: user, password });
	};

	const handleLoginSubmit = (e: FormEvent) => {
		e.preventDefault();
		login({ email: user, password });
	};

	if (status === "checking")
		return (
			<div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
				<LoadingLogo />
			</div>
		);

	if (status === "offline") {
		router("/error");
		return null;
	}

	if (loadingAuthUser)
		return (
			<div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
				<Loading />
				<div>Verificando sesión...</div>
			</div>
		);

	if (authUser) {
		router("/dashboard");
		return null;
	}

	return (
		<div className="flex items-center justify-center dark:bg-slate-800 min-h-screen p-4">
			<div className="fixed inset-0 z-0">
				<div className="nebula" />
			</div>
			{isLoginPage ? (
				<div className="w-80 relative bg-white dark:bg-slate-900 overflow-hidden rounded-lg px-6 py-8 flex items-center flex-col gap-4 shadow-2xl before:absolute before:w-32 before:h-20 before:right-2 before:bg-rose-300 before:-z-10 before:rounded-full before:blur-xl before:-top-12 z-10 after:absolute after:w-24 after:h-24 after:bg-purple-300 dark:before:bg-rose-700 after:-z-10 after:rounded-full after:blur dark:after:bg-rose-600/50 after:-top-12 after:-right-6">
					<div className="flex items-center flex-col justify-center gap-2">
						<div className="flex gap-2 items-center justify-center">
							<h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
								SYSGD
							</h1>
						</div>
						<p className="text-slate-600 text-sm dark:text-slate-100">
							Iniciar sesión
						</p>
					</div>

					<form
						onSubmit={handleLoginSubmit}
						className="flex flex-col gap-4 w-full"
					>
						<div className="space-y-2">
							<Label htmlFor="user">Usuario:</Label>
							<Input
								placeholder="user@email.com"
								id="user"
								type="text"
								value={user}
								onChange={(e) => setUser(e.target.value)}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Contraseña:</Label>
							<Input
								id="password"
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full"
							/>
						</div>

						<Button
							type="submit"
							disabled={password === "" || user === "" || loginLoading}
							className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-base px-8 py-4 w-full cursor-pointer"
						>
							{loginLoading ? "Cargando..." : "Iniciar sesión"}
						</Button>

						{loginError && (
							<p className="text-red-500 text-sm text-center">{loginError}</p>
						)}
					</form>

					<div className="w-full flex items-center justify-center gap-2">
						<div className="flex-1 h-0.5 bg-slate-300" />
						<span className="text-xs text-slate-500 whitespace-nowrap">
							O CONTINUA CON
						</span>
						<div className="flex-1 h-0.5 bg-slate-300" />
					</div>

					<ButtonGoogle />

					<div className="text-center text-sm text-slate-600">
						¿No tienes una cuenta?{" "}
						<button
							type="button"
							onClick={() => setIsLoginPage(false)}
							className="text-blue-600 hover:text-blue-800 underline font-medium"
						>
							Crear cuenta
						</button>
					</div>
				</div>
			) : (
				<div className="w-96 relative bg-white dark:bg-slate-900 overflow-hidden rounded-lg px-6 py-8 flex items-center flex-col gap-4 shadow-2xl before:absolute before:w-32 before:h-20 before:right-2 before:bg-rose-300 before:-z-10 before:rounded-full before:blur-xl before:-top-12 z-10 after:absolute after:w-24 after:h-24 after:bg-purple-300 dark:after:bg-rose-600/50 dark:before:bg-rose-700 after:-z-10 after:rounded-full after:blur after:-top-12 after:-right-6">
					<div className="flex items-center flex-col justify-center gap-2">
						<div className="flex gap-2 items-center justify-center">
							<h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
								SYSGD
							</h1>
						</div>
						<p className="text-slate-600 text-sm dark:text-slate-100">
							Crear cuenta
						</p>
					</div>

					<form
						onSubmit={handleRegisterSubmit}
						className="flex flex-col gap-4 w-full"
					>
						<div className="space-y-2">
							<Label htmlFor="name">Nombre: *</Label>
							<Input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Correo: *</Label>
							<Input
								id="email"
								type="email"
								value={user}
								onChange={(e) => setUser(e.target.value)}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="register-password">Contraseña:</Label>
							<Input
								id="register-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirmar Contraseña:</Label>
							<Input
								id="confirm-password"
								type="password"
								value={repetPassword}
								onChange={(e) => setRepetPassword(e.target.value)}
								className="w-full"
							/>
						</div>

						<Button
							type="submit"
							disabled={
								loading || password === "" || user === "" || name === ""
							}
							className="w-full"
						>
							{loading ? "Registrando..." : "Registrar"}
						</Button>

						{error && (
							<p className="text-red-500 text-sm text-center">{error}</p>
						)}
						{success && (
							<p className="text-green-500 text-sm text-center">
								¡Usuario registrado con éxito!
							</p>
						)}
					</form>
					<p className="text-xs text-slate-500 text-center mt-2">
						Al registrarte, aceptas nuestros{" "}
						<a
							href="/terms"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:text-blue-800 underline"
						>
							Términos y Condiciones
						</a>{" "}
						y nuestra{" "}
						<a
							href="/privacy"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:text-blue-800 underline"
						>
							Política de Privacidad
						</a>
						.
					</p>
					<div className="w-full flex items-center justify-center gap-2">
						<div className="flex-1 h-0.5 bg-slate-300" />
						<span className="text-xs text-slate-500 whitespace-nowrap">
							O CONTINUA CON
						</span>
						<div className="flex-1 h-0.5 bg-slate-300" />
					</div>

					<ButtonGoogle />

					<div className="text-center text-sm text-slate-600">
						¿Ya tienes cuenta?{" "}
						<button
							type="button"
							onClick={() => setIsLoginPage(true)}
							className="text-blue-600 hover:text-blue-800 underline font-medium"
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
			className="w-full px-3 py-3 bg-blue-500 hover:bg-blue-600 rounded-md flex items-center justify-center text-white font-medium cursor-pointer transition-colors"
		>
			{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
			<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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

export default Login;
