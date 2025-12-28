import type { FC, HTMLAttributes } from "react";

export interface Row {
	field1: string;
	field2: string;
}

export interface TableProps extends HTMLAttributes<HTMLTableElement> {}

const Table: FC<TableProps> = ({ children }) => {
	return (
		<table
			suppressContentEditableWarning
			id="myTable"
			className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400"
		>
			{children}
		</table>
	);
};

export interface TdProps extends HTMLAttributes<HTMLTableCellElement> {
	label: string;
}

export const Td: FC<TdProps> = ({ label, ...props }) => {
	return (
		<td
			suppressContentEditableWarning
			contentEditable
			className="p-2 border dark:border-gray-700 break-words max-w-28"
			{...props}
		>
			{label}
		</td>
	);
};

export const Th: FC<{ label: string }> = ({ label }) => {
	return (
		<th className="p-2 border dark:border-gray-700 text-center">{label}</th>
	);
};

export default Table;
