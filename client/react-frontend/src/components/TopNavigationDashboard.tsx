import { Button } from "@/components/ui/button";
import { Home, Settings, Bell } from "lucide-react";
import { NotificationsPopup } from "./NotificationsPopup";
import { useState } from "react";
import UserProfileTrigger from "./UserProfileTrigger";
import SettingsModal from "./SettingsModal";
import { IoChatboxOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

interface TopNavigationProps {
	onHomeClick: () => void;
}

export function TopNavigation({ onHomeClick }: TopNavigationProps) {
	const [showNotifications, setShowNotifications] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const navigate = useNavigate();

	return (
		<header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-50">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 md:gap-4">
					{/* Breadcrumb */}
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={onHomeClick}
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
					<Button
						onClick={() => navigate("/chat")}
						variant="ghost"
						size="sm"
						className="flex"
					>
						<IoChatboxOutline className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowNotifications(!showNotifications)}
						className="relative"
					>
						<Bell className="w-4 h-4" />
						<div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
					</Button>

					<Button
						onClick={() => setIsSettingsOpen(true)}
						variant="ghost"
						size="sm"
						className="flex"
					>
						<Settings className="w-4 h-4" />
					</Button>
					<div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
						<UserProfileTrigger />
					</div>
				</div>
			</div>
			<NotificationsPopup
				isOpen={showNotifications}
				onClose={() => setShowNotifications(false)}
			/>
			<SettingsModal
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
			/>
		</header>
	);
}
