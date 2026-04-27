import { type FC, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

export type SelectProps = {
	options: DropdownOptionProps[];
	label: string;
};

const Select: FC<SelectProps> = ({ options, label }) => {
	const [isDropdownOptionVisibility, setIsDropdownOptionVisibility] =
		useState(false);

	const [select, setSelect] = useState(options[0].select);

	return (
		<div className="relative w-full inline-block border dark:border-slate-600 bg-white dark:bg-slate-900 rounded">
			<div className="border-b w-full dark:border-slate-600 dark:text-slate-200 p-1 text-sm font-medium">
				{label}
			</div>
			<button
				onClick={() => {
					setIsDropdownOptionVisibility(!isDropdownOptionVisibility);
				}}
				type="button"
				className="flex w-full h-7 cursor-pointer items-center justify-center gap-2 rounded-full bg-transparent p-2 text-sm dark:text-slate-300"
			>
				<div className="w-full text-left">{select}</div>

				<IoIosArrowDown />
			</button>

			<div
				className={
					"absolute w-full rounded-lg bg-slate-100 dark:bg-slate-950 z-10 shadow-2xl " +
					(isDropdownOptionVisibility ? "inline-block" : "hidden")
				}
			>
				{options.map((option, index) => (
					<DropdownOption
						select={option.select}
						key={index}
						onClick={() => {
							setSelect(option.select);
							setIsDropdownOptionVisibility(false);
							option.onClick();
						}}
					/>
				))}
			</div>
		</div>
	);
};

export default Select;

type DropdownOptionProps = {
	select: string;
	onClick: () => void;
};

const DropdownOption: FC<DropdownOptionProps> = ({ select, onClick }) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full dark:text-slate-300 cursor-pointer items-center justify-center gap-2 bg-transparent p-2 text-left text-sm hover:dark:bg-slate-800"
		>
			<div className="w-full">{select}</div>
		</button>
	);
};
