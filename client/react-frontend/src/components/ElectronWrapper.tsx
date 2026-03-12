import type React from "react";
import { useEffect, useState } from "react";
import { TitleBar } from "./TitleBar";

// Detección robusta del entorno
const isElectron = () => {
	return (
		!!window?.process?.versions?.electron ||
		!!window?.electronAPI ||
		navigator.userAgent.toLowerCase().indexOf("electron") > -1
	);
};

interface ElectronWrapperProps {
	children: React.ReactNode;
}

export const ElectronWrapper: React.FC<ElectronWrapperProps> = ({
	children,
}) => {
	const [isElectronEnv, setIsElectronEnv] = useState(false);

	useEffect(() => {
		setIsElectronEnv(isElectron());
	}, []);

	// Si no estamos en Electron, renderizar children sin wrapper
	if (!isElectronEnv) {
		return <div className="h-screen relative">{children}</div>;
	}

	// Si estamos en Electron, renderizar con barra de título
	return (
		<div className="h-screen flex flex-col overflow-hidden">
			<TitleBar />
			<div className="flex-1 w-full overflow-y-auto relative">{children}</div>
		</div>
	);
};
