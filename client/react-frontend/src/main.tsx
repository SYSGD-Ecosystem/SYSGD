import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./pages/App.tsx";
import Login from "./pages/Login.tsx";
import DevPreview from "./pages/DevPreview.tsx";
import "./styles/tailwind.css"
import Print from "./pages/Print.tsx";
import ErrorServer from "./pages/ErrorServer.tsx";
import OrganigramaPage from "./pages/Organigrama.tsx";
import EditableSpreadsheet from "./pages/Sheet.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import AdminDashboard from "./pages/admin-dashboard.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import SYSGDDashboard from "./pages/Demo.tsx";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<App/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/print" element={<Print/>}/>
      <Route path="/dev" element={<DevPreview/>}/>
      <Route path="/error" element={<ErrorServer/>}/>
      <Route path="/organigrama" element={<OrganigramaPage />} />
      <Route path="/table" element={<EditableSpreadsheet />} />
      <Route path="/demo" element={<SYSGDDashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
    </BrowserRouter>
    <Toaster/>
  </StrictMode>
);
