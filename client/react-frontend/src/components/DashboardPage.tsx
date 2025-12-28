import { useEffect } from "react"; // 1. Importamos useEffect
import { useNavigate } from "react-router-dom";
import { useAuthSession } from "@/hooks/connection/useAuthSession";
import { TopNavigation } from "./TopNavigationDashboard";
import { HomeDashboard } from "./home-dashboard";
import Loading from "./Loading";

function MainPage() {
	const navigate = useNavigate();
	const { user, loading } = useAuthSession();

	// 2. Manejamos la redirección como un efecto secundario
	useEffect(() => {
		if (!loading && !user) {
			navigate("/login");
		}
	}, [user, loading, navigate]);

	if (loading) {
		return (
			<div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
				<Loading />
			</div>
		);
	}

	// 3. Si no hay usuario, retornamos null mientras el useEffect hace su trabajo
	if (!user) {
		return null;
	}

	const handleHomeClick = () => {
		navigate("/");
	};

	return (
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
			<TopNavigation onHomeClick={handleHomeClick} />
			<HomeDashboard />
		</div>
	);
}

export default function Page() {
	return <MainPage />;
}
