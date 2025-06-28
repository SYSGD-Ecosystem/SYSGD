import type { FC } from "react";
import { IoIosAlert } from "react-icons/io";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

const ErrorServer: FC = () => {
	const navigate = useNavigate()
	return (
		<div className="h-screen items-center justify-center flex flex-col bg-black">
            <IoIosAlert className="text-red-500 text-xl"/>
			<div className="text-xl text-red-500">Servidor no disponible</div>
			<Button onClick={()=>{navigate("/")}}>Reintentar</Button>
		</div>
	);
};

export default ErrorServer;
