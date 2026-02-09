import { Outlet } from "react-router-dom"

import { AdminSidebar } from "../../components/Sidebar"

export default function AdminLayout() {
	return (
		<div className="min-h-screen admin-animated-bg">
			<AdminSidebar />
			<main className="lg:pl-64">
				<div className="p-6 pt-16 lg:pt-6">
					<Outlet />
				</div>
			</main>
		</div>
	)
}
