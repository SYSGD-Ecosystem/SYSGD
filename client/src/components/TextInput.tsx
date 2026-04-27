import type { FC } from "react";

const TextInput: FC<{ label: string }> = ({ label }) => {
	return (
		<label className="flex flex-col border dark:border-slate-600 w-full bg-white dark:bg-slate-900 rounded overflow-hidden">
			<span className="border-b dark:border-slate-600 dark:text-slate-200 p-1 text-sm font-medium">
				{label}
			</span>
			<textarea className="border-none resize-none min-h-20 w-full p-1 outline-none dark:bg-slate-900 dark:text-slate-200"></textarea>
		</label>
	);
};

export default TextInput;
