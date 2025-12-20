import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
import { ElectronWrapper } from "@/components/ElectronWrapper";
import App from "./pages/App.tsx";
import Login from "./pages/Login.tsx";
import DevPreview from "./pages/DevPreview.tsx";
import Print from "./pages/Print.tsx";
import ErrorServer from "./pages/ErrorServer.tsx";
import OrganigramaPage from "./pages/Organigrama.tsx";
import EditableSpreadsheet from "./pages/Sheet.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import AdminDashboard from "./pages/admin-dashboard.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import TermsAndConditions from "./pages/Terms.tsx";
import PrivacyPolicy from "./pages/Privacy.tsx";
import ProjectsPage from "./components/DashboardPage.tsx";
import ProjectWorkSpace from "./components/projects/ProjectsWorkSpace.tsx";
import ProjectPageDemo from "./components/demo/page.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import HomeChat from "./chat/app/page.tsx";
import AppRouter from "./AppRouter.tsx";
import { Toaster as SonnerToaster } from "sonner";


// biome-ignore lint/style/noNonNullAssertion: <explanation>
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ElectronWrapper>
        <AppRouter>
          <Routes>
            <Route path="/" element={<App/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/print" element={<Print/>}/>
            <Route path="/dev" element={<DevPreview/>}/>
            <Route path="/error" element={<ErrorServer/>}/>
            <Route path="/organigrama" element={<OrganigramaPage />} />
            <Route path="/table" element={<EditableSpreadsheet />} />
            <Route path="/demo" element={<ProjectPageDemo />} />
            <Route path="/archives" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/dashboard" element={<ProjectsPage />} />
            <Route path="/projects" element={<ProjectWorkSpace />} />
            <Route path="/landpage" element={<LandingPage />} />
            <Route path="/chat" element={<HomeChat />} />
          </Routes>
        </AppRouter>
      </ElectronWrapper>
    </ThemeProvider>
    <Toaster/>
    <SonnerToaster />
  </StrictMode>
);
