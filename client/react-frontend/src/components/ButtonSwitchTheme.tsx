import type { FC } from "react";
import useTheme from "../hooks/useTheme";
import {
	TooltipProvider,
	TooltipTrigger,
	Tooltip,
	TooltipContent,
} from "./ui/tooltip";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

const ButtonSwitchTheme: FC = () => {
	const { toggleTheme, theme } = useTheme();

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						onClick={toggleTheme}
						className="text-slate-300 hover:text-white"
					>
						{theme === "dark" ? (
							<Sun className="w-4 h-4" />
						) : (
							<Moon className="w-4 h-4 text-slate-500" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Cambiar tema</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export default ButtonSwitchTheme;
