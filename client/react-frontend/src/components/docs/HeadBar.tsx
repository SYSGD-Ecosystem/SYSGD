import type { FC } from "react";
import { IoIosApps } from "react-icons/io";
import { Link } from "react-router-dom";
import ButtonSwitchTheme from "../ButtonSwitchTheme";
import UserProfileTrigger from "../UserProfileTrigger";

const HeadBar: FC = () => {
	return (
		<div className="w-full min-h-11 border-b dark:border-none bg-slate-300 dark:bg-slate-900 items-center px-2 flex">
			<div className="w-full flex items-center gap-1">
				<Link
					to="/"
					className="text-slate-800 dark:text-white flex items-center gap-1 w-full text-lg font-medium"
				>
					<div>
						<IoIosApps
							size={24}
							className="text-slate-900 dark:text-slate-100"
						/>
					</div>
					SYSGD
				</Link>
			</div>
			<UserProfileTrigger />
			<ButtonSwitchTheme />
		</div>
	);
};

export default HeadBar;
