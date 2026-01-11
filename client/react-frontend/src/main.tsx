import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes } from "react-router-dom";
import { Toaster as SonnerToaster } from "sonner";
import { ElectronWrapper } from "@/components/ElectronWrapper";
import { ThemeProvider } from "@/contexts/theme-context";
import AppRouter from "./AppRouter.tsx";
import HomeChat from "./chat/app/page.tsx";
import ProjectsPage from "./components/DashboardPage.tsx";
import ProjectPageDemo from "./components/demo/page.tsx";
import ProjectWorkSpace from "./components/projects/ProjectsWorkSpace.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import App from "./pages/App.tsx";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import DevPreview from "./pages/DevPreview.tsx";
import ErrorServer from "./pages/ErrorServer.tsx";
import Help from "./pages/Help.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import Login from "./pages/Login.tsx";
import OrganigramaPage from "./pages/Organigrama.tsx";
import Print from "./pages/Print.tsx";
import PrivacyPolicy from "./pages/Privacy.tsx";
import EditableSpreadsheet from "./pages/Sheet.tsx";
import TermsAndConditions from "./pages/Terms.tsx";
import TokenManagement from "./components/TokenManagement.tsx";
import Purchase from "./pages/Purchase.tsx";
import SettingsPage from "./pages/SettingPage.tsx";
import SystemDashboard from "./pages/SystemDashboard.tsx";
import PageNotFound from "./pages/PageNotFound.tsx";
import AboutPage from "./pages/AboutPage.tsx";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ThemeProvider>
			<ElectronWrapper>
				<AppRouter>
					<Routes>
						<Route path="/" element={<App />} />
						<Route path="/login" element={<Auth />} />
						<Route path="/login-old" element={<Login />} />
						<Route path="/print" element={<Print />} />
						<Route path="/dev" element={<DevPreview />} />
						<Route path="/error" element={<ErrorServer />} />
						<Route path="/organigrama" element={<OrganigramaPage />} />
						<Route path="/table" element={<EditableSpreadsheet />} />
						<Route path="/demo" element={<ProjectPageDemo />} />
						<Route path="/archives" element={<Dashboard />} />
						<Route path="/admin" element={<Admin />} />
						<Route path="/terms" element={<TermsAndConditions />} />
						<Route path="/privacy" element={<PrivacyPolicy />} />
						<Route path="/old-dashboard" element={<ProjectsPage />} />
						<Route path="/projects" element={<ProjectWorkSpace />} />
						<Route path="/landpage" element={<LandingPage />} />
						<Route path="/chat" element={<HomeChat />} />
						<Route path="/help" element={<Help />} />
						<Route path="/settings" element={<SettingsPage />} />
						<Route path="/settings/tokens" element={<TokenManagement />} />
						<Route path="/billing/purchase" element={<Purchase />} />
						<Route path="/billing/upgrade" element={<Purchase />} />
						<Route path="/dashboard" element={<SystemDashboard />} />
						<Route path="/about" element={<AboutPage/>} />
						<Route path="/*" element={<PageNotFound/>} />
					</Routes>
				</AppRouter>
			</ElectronWrapper>
		</ThemeProvider>
		<Toaster />
		<SonnerToaster />
	</StrictMode>,
);
