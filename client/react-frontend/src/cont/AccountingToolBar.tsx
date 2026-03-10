import { Button } from "@/components/ui/button";
import UserProfileTrigger from "@/components/UserProfileTrigger";
import { Home } from "lucide-react";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

type AccountingToolBarProps = {
    onMobileSidebarToggle: () => void;
};

const AccountingToolBar: FC<AccountingToolBarProps> = ({ onMobileSidebarToggle }) => {
	const navigate = useNavigate();

	return (
		<header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-50">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 md:gap-4">
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden"
							onClick={onMobileSidebarToggle}
						>
							{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								navigate("/dashboard");
							}}
							className={
								"flex items-center gap-2 text-blue-600 dark:text-blue-400"
							}
						>
							<Home className="w-4 h-4" />
							<span className="hidden sm:inline">Inicio</span>
						</Button>
					</div>

					<div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />

					<div className="flex items-center gap-2">
						<div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
							<span className="text-white text-xs font-bold">S</span>
						</div>
						<span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:inline">
							SYSGD
						</span>
					</div>
				</div>

				<div className="flex items-center gap-1 md:gap-2">
					<div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
						<UserProfileTrigger />
					</div>
				</div>
			</div>
		</header>
	);
};

export default AccountingToolBar;
