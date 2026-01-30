import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import UpdatesPage from "./app/admin/updates/page.tsx";
import AdminDashboard from "./app/admin/page.tsx";
import LoginPage from "./app/login/page.tsx";
import UsersPage from "./app/admin/usuarios/page.tsx";

import AdminLayout from "./components/layouts/AdminLayout.tsx";
import ProtectedRoute from "./components/routing/ProtectedRoute.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<LoginPage />} />
				<Route
					path="/admin"
					element={
						<ProtectedRoute>
							<AdminLayout />
						</ProtectedRoute>
					}
				>
					<Route index element={<AdminDashboard />} />
					<Route path="usuarios" element={<UsersPage />} />
					<Route path="updates" element={<UpdatesPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
