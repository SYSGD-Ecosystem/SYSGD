import { useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import useServerStatus from "../hooks/connection/useServerStatus";
import { useAuthSession } from "../hooks/connection/useAuthSession";
import Loading from "@/components/Loading";
import LandingPage from "./LandingPage";

const App: FC = () => {
	const navigate = useNavigate();
	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
	const { status, checkServerStatus } = useServerStatus(serverUrl);
	const { user, loading } = useAuthSession();

	useEffect(() => {
		checkServerStatus();
	}, [checkServerStatus]);

	// Si el servidor no está disponible
	if (status === "checking")
		return (
			<div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
				<Loading />
			</div>
		);

	if (status === "offline") {
		navigate("/error");
		return null;
	}

	// Si aún está verificando sesión
	if (loading)
		return (
			<div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
				<Loading />
				<div>Verificando sesión...</div>
			</div>
		);

	if (user) {
		navigate("/dashboard");
		return null;
	}

	return <LandingPage />;
};

export default App;
