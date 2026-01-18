import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import UpdatesPage from "./app/admin/updates/page.tsx";
import AdminDashboard from "./app/admin/page.tsx";
import LoginPage from "./app/login/page.tsx";
import UsersPage from "./app/admin/usuarios/page.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<LoginPage />} />
				<Route path="/updates" element={<UpdatesPage />} />
				<Route path="/users" element={<UsersPage />} />
				<Route path="/admin" element={<AdminDashboard />} />
				
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
