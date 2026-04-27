import { Github, Twitter } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { IoArchive } from "react-icons/io5";
import { Link } from "react-router-dom";
import BarButton from "../BarButton";

type SidebarProps = {
	onOptionSelected: (option: number) => void;
};

const Sidebar: FC<SidebarProps> = ({ onOptionSelected }) => {
	const [option, setOption] = useState(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		onOptionSelected(option);
	}, [option]);

	return (
		<div className="w-full max-w-60 hidden dark:border-r border-r h-full md:flex flex-col bg-white dark:bg-slate-800">
			<div className="size-full flex flex-col">
				<BarButton
					isSelected={option === 0}
					onClick={() => {
						setOption(0);
					}}
					Icon={IoArchive}
					label="Cuadro de clasificacón"
				/>
				<BarButton
					isSelected={option === 1}
					onClick={() => {
						setOption(1);
					}}
					Icon={IoArchive}
					label="Tabla de Retencion Documental"
				/>
				<BarButton
					isSelected={option === 2}
					onClick={() => {
						setOption(2);
					}}
					Icon={IoArchive}
					label="Registro de entrada"
				/>
				<BarButton
					isSelected={option === 3}
					onClick={() => {
						setOption(3);
					}}
					Icon={IoArchive}
					label="Registro de Salida"
				/>
				<BarButton
					isSelected={option === 4}
					onClick={() => {
						setOption(4);
					}}
					Icon={IoArchive}
					label="Registro de prestamo"
				/>
				<BarButton
					isSelected={option === 5}
					onClick={() => {
						setOption(5);
					}}
					Icon={IoArchive}
					label="Registro topografico"
				/>
			</div>
			<div className="flex items-center justify-center p-1 border-t bg-slate-50 dark:bg-transparent dark:border-slate-700">
				<div className=" font-normal text-base w-full">
					<span className="text-slate-500 dark:text-slate-300">
						&copy; SYSGD 2025
					</span>
				</div>
				<div className="flex gap-1 items-center">
					<Link
						to="https://github.com/lazaroysr96/sysgd/"
						target="_blank"
						className="text-slate-500 p-2 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200"
					>
						<Github className="w-4 h-4" />
					</Link>
					<Link
						to="https://x.com/SYSGD_"
						target="_blank"
						className="text-slate-500 p-2 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200"
					>
						<Twitter className="w-4 h-4" />
					</Link>{" "}
				</div>
			</div>
		</div>
	);
};

export default Sidebar;
