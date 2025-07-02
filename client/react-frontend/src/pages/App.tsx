import { useEffect, useState, type FC } from "react";
import WorkSpace from "../components/WorkSpace";
import Sidebar from "../components/Sidebar";
import HeadBar from "../components/HeadBar";
import NavBar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import useServerStatus from "../hooks/connection/useServerStatus";
import { useAuthSession } from "../hooks/connection/useAuthSession";
import Loading from "@/components/Loading";
import { Toaster } from "sonner";

const App: FC = () => {
	const navigate = useNavigate();
	const [optionMainSelected, setOptionMainSelected] = useState(0);
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
	if (loading) return <div>Verificando sesión...</div>;

	// Si no hay sesión
	if (!user) {
		navigate("/login");
		return null;
	}

	// Si todo está bien, muestra la app
	return (
		<div className="flex h-screen w-full flex-col">
			<HeadBar />
			<div className="size-full flex overflow-auto">
				<NavBar />
				<Sidebar onOptionSelected={setOptionMainSelected} />
				<WorkSpace page={optionMainSelected} />
			</div>
			<Toaster />
		</div>
	);
};

export default App;
