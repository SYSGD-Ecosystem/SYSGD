import { type FC, type FormEvent, useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import Text, { Variant } from "../components/Text";
import { IoIosApps } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useRegisterUser } from "../hooks/connection/useRegisterUser";
import { useLogin } from "../hooks/connection/useLogin";

const Login: FC = () => {
	const [isLoginPage, setIsLoginPage] = useState(true);
	const navigate = useNavigate();
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

	const handleRegisterSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (password !== repetPassword) {
			alert("Las contraseñas no coinciden");
			return;
		}

		register({ name, username: user, password });
	};


	const handleLoginSubmit = (e: FormEvent) => {
		e.preventDefault()

		login({ username: user, password });
	};

	if (loginSuccess) {
		navigate("/")

	}
	return (
		<div className="flex items-center justify-center bg-slate-800 h-screen">
			{isLoginPage ? (
				<div className="w-80 relative bg-white overflow-hidden h-max rounded px-2 py-4 flex items-center flex-col gap-2 shadow before:absolute before:w-32 before:h-20 before:right-2 before:bg-rose-300 before:-z-10 before:rounded-full before:blur-xl before:-top-12 z-10 after:absolute after:w-24 after:h-24 after:bg-purple-300 after:-z-10 after:rounded-full after:blur after:-top-12 after:-right-6">
					<div className="flex items-center flex-col justify-center">
						<div className="flex gap-1 w-max items-center justify-center">
							<div>
								<IoIosApps size={24} />
							</div>
							<Text label="SYSGD" variant={Variant.Heading} />
						</div>

						<Text label="Iniciar sesión" variant={Variant.Span} />
					</div>

					<form
						onSubmit={handleLoginSubmit}
						className="flex flex-col gap-2 items-center justify-center"
					>
						<Input onChange={setUser} label="Usuario:" type="text" />
						<Input onChange={setPassword} label="Contraseña:" type="password" />
						<Button isDisabled={password === "" || user === ""}>
							{loading ? "Cargando..." : "Iniciar sesión"}
						</Button>
						{loginError && <p className="text-red-500">{loginError}</p>}
					</form>
					<div className="w-full items-center justify-center flex gap-1">
						<div className="w-full h-0.5 bg-slate-500" />
						<div className="text-xs text-nowrap">O CONTINUA CON</div>
						<div className="w-full h-0.5 bg-slate-500" />
					</div>
					<ButtonGoogle />
					<div className="text-center text-sm text-muted-foreground">
						¿No tienes una cuenta?{" "}
						<Button
							onClick={() => {
								setIsLoginPage(false);
							}}
							className="underline hover:text-primary"
						>
							Crear cuenta
						</Button>
					</div>
				</div>
			) : (
				<>
					<div className="w-96 relative bg-white overflow-hidden h-max rounded px-2 py-4 flex items-center flex-col gap-2 shadow before:absolute before:w-32 before:h-20 before:right-2 before:bg-rose-300 before:-z-10 before:rounded-full before:blur-xl before:-top-12 z-10 after:absolute after:w-24 after:h-24 after:bg-purple-300 after:-z-10 after:rounded-full after:blur after:-top-12 after:-right-6">
						<div className="flex items-center flex-col justify-center">
							<div className="flex gap-1 w-max items-center justify-center">
								<div>
									<IoIosApps size={24} />
								</div>
								<Text label="SYSGD" variant={Variant.Heading} />
							</div>

							<Text label="Crear cuenta" variant={Variant.Span} />
						</div>

						<form
							onSubmit={handleRegisterSubmit}
							className="flex flex-col gap-2 items-center justify-center"
						>
							<Input onChange={setName} label="Nombre: *" type="text" />
							<Input onChange={setUser} label="Correo: *" type="text" />
							<Input
								onChange={setPassword}
								label="Contraseña:"
								type="password"
							/>
							<Input
								onChange={setRepetPassword}
								label="Confirmar Contraseña:"
								type="password"
							/>
							<Button isDisabled={loading || password === "" || user === ""}>
								{loading ? "Registrando..." : "Registrar"}
							</Button>
							{error && <p className="text-red-500">{error}</p>}
							{success && (
								<p className="text-green-500">¡Usuario registrado con éxito!</p>
							)}
						</form>
						<div className="w-full items-center justify-center flex gap-1">
							<div className="w-full h-0.5 bg-slate-500" />
							<div className="text-xs text-nowrap">O CONTINUA CON</div>
							<div className="w-full h-0.5 bg-slate-500" />
						</div>
						<ButtonGoogle />
						<div className="text-center text-sm text-muted-foreground">
							¿Ya tienes cuenta?{" "}
							<Button
								onClick={() => {
									setIsLoginPage(true);
								}}
								className="underline hover:text-primary"
							>
								Iniciar sesión
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default Login;

const ButtonGoogle: FC = () => {
	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
	return (
		// biome-ignore lint/a11y/useButtonType: <explanation>
		<button onClick={()=>{window.location.href = `${serverUrl}/api/auth/google`;}} className="px-2 h-11 bg-blue-500 rounded flex items-center justify-center text-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-blue-600 dark:hover:bg-gray-700">
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
