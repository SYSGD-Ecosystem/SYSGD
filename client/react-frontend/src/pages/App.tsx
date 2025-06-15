import { FC, useEffect, useState } from "react";
import MainContainer from "../components/MainContainer";
import Sidebar from "../components/Sidebar";
import HeadBar from "../components/HeadBar";
import NavBar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import useConnection from "../hooks/useConnection";
import useConnection2 from "../hooks/useConnection2";

const App: FC = () => {
	const navigate = useNavigate();
	const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
	const { checkServerStatus, status } = useConnection2(serverUrl);

	useEffect(() => {
		checkServerStatus();
	}, [checkServerStatus]);

	if (status === "checking") {
		return <div>Verificando servidor...</div>;
	}

	if (status === "offline") {
		navigate("login");
		return null;
	}

	return (
		<div className="flex h-screen w-full flex-col">
			<HeadBar />
			<div className="size-full flex overflow-auto">
				<NavBar />
				<Sidebar />

				<MainContainer />
			</div>
		</div>
	);
};

export default App;
