import type React from "react";
import { useEffect, useState } from "react";
import { TitleBar } from "./TitleBar";
import { LicenseProvider, useLicense } from "@/contexts/LicenseContext";
import WelcomeScreen from "@/screens/WelcomeScreen";
import SetupAccountScreen from "@/screens/SetupAccountScreen";
import LicenseActivationScreen from "@/screens/LicenseActivationScreen";

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

function ElectronContent({ children }: ElectronWrapperProps) {
	const { setupStep, isLoading } = useLicense();

	// Mostrar loading mientras se verifica la licencia
	if (isLoading) {
		return (
			<div className="h-screen flex items-center justify-center bg-slate-900">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
			</div>
		);
	}

	// Si no está completo el setup, mostrar las pantallas correspondientes
	if (setupStep !== "complete" && window.electronAPI) {
		switch (setupStep) {
			case "welcome":
				return <WelcomeScreen />;
			case "setup-account":
				return <SetupAccountScreen />;
			case "license":
				return <LicenseActivationScreen />;
			default:
				break;
		}
	}

	// Setup completo, mostrar la app normal
	return (
		<div className="h-screen flex flex-col overflow-hidden">
			<TitleBar />
			<div className="flex-1 w-full overflow-y-auto relative z-10">
				{children}
			</div>
		</div>
	);
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

	// Si estamos en Electron, envolver con LicenseProvider
	return (
		<LicenseProvider>
			<ElectronContent>{children}</ElectronContent>
		</LicenseProvider>
	);
};
