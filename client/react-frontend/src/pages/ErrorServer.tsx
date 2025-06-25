import type { FC } from "react";
import { IoIosAlert } from "react-icons/io";

const ErrorServer: FC = () => {
	return (
		<div className="h-screen items-center justify-center flex flex-col bg-black">
            <IoIosAlert className="text-red-500 text-xl"/>
			<div className="text-xl text-red-500">Servidor no disponible</div>
		</div>
	);
};

export default ErrorServer;
