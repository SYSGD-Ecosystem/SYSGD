import type { FC } from "react";
import type { IconType } from "react-icons";
import { Button } from "./ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

export type IconButtonProps = {
	tooltip: string;
	onClick: () => void;
	Icon: IconType;
	className?: string;
};

const IconButton: FC<IconButtonProps> = ({ onClick, Icon, tooltip }) => {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClick}
						className="text-slate-300 hover:text-white"
					>
						<Icon className="w-4 h-4 text-slate-500 dark:text-slate-100" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{tooltip}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export default IconButton;
