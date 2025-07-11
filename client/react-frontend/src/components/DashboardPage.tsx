import { TopNavigation } from "./TopNavigationDashboard";
import { ThemeProvider } from "@/context/theme-context";
import { HomeDashboard } from "./home-dashboard";
import { useAuthSession } from "@/hooks/connection/useAuthSession";
import Loading from "./Loading";
import { useNavigate } from "react-router-dom";

function MainPage() {
	const navigate = useNavigate();

	const { user, loading } = useAuthSession();

	if (loading) {
		return (
			<div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
				<Loading />
				<div>Verificando sesión...</div>
			</div>
		);
	}

	if (!user) {
		navigate("/login");
		return null;
	}

	const handleHomeClick = () => {};
	return (
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
			<TopNavigation
				onHomeClick={handleHomeClick}
			/>
			<HomeDashboard />
		</div>
	);
}

export default function Page() {
	return (
		<ThemeProvider>
			<MainPage />
		</ThemeProvider>
	);
}
