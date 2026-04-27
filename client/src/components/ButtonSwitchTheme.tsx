import { Moon, Sun } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

const ButtonSwitchTheme: FC = () => {
	const [darkMode, setDarkMode] = useState(true);
	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [darkMode]);
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setDarkMode(!darkMode)}
					>
						{darkMode ? (
							<Sun className="w-4 h-4" />
						) : (
							<Moon className="w-4 h-4" />
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
