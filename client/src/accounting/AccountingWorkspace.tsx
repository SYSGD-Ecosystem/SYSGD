import { FC, useState } from "react";
import AccountingToolBar from "./AccountingToolBar";
import AccountingSidebar from "./AccountingSidebar";
import ExpenseRegisterPage from "./core/ExpenseRegisterPage";
import FichaPrecio from "./FichaPrecio";
import GC_TCP from "./core/components/GC_TCP";

const AccountingWorkspace: FC = () => {
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [activeSection, setActiveSection] = useState("dj");

	const handleSectionChange = (section: string) => {
		setActiveSection(section);
		setIsMobileSidebarOpen(false);
	};

	return (
		<div className="h-full w-full bg-gray-100 dark:bg-gray-900 flex flex-col">
			<AccountingToolBar
				onMobileSidebarToggle={() =>
					setIsMobileSidebarOpen(!isMobileSidebarOpen)
				}
			/>

			<div className="flex flex-1 relative overflow-hidden">
				<AccountingSidebar
					activeSection={activeSection}
					onSectionChange={handleSectionChange}
					isMobileOpen={isMobileSidebarOpen}
					onMobileClose={() => setIsMobileSidebarOpen(false)}
				/>
				<main className="flex-1 overflow-hidden">
					{activeSection === "dj" && (<ExpenseRegisterPage />)}
					{activeSection === "fichaprecio" && (<FichaPrecio />)}
					{activeSection === "gc_tcp" && (<GC_TCP />)}
				</main>
			</div>
		</div>
	);
};

export default AccountingWorkspace;
