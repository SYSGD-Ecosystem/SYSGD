import { Outlet } from "react-router-dom"

import { AdminSidebar } from "../../components/Sidebar"

export default function AdminLayout() {
	return (
		<div className="min-h-screen relative overflow-hidden bg-slate-950">
			<div className="absolute inset-0 admin-animated-bg" aria-hidden="true" />
			<div className="relative z-10">
				<AdminSidebar />
				<main className="lg:pl-64">
					<div className="p-6 pt-16 lg:pt-6">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	)
}
