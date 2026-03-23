import { useState } from "react";

function useEditableTable<T extends Record<string, string>>(initialRows: T[]) {
	const [rows, setRows] = useState<T[]>(initialRows);

	const addRow = () => {
		const emptyRow = Object.fromEntries(
			Object.keys(rows[0] || {}).map((key) => [key, ""]),
		) as T;
		setRows([...rows, emptyRow]);
	};

	const updateRow = (index: number, field: keyof T, value: string) => {
		const newRows = [...rows];
		newRows[index] = { ...newRows[index], [field]: value };
		setRows(newRows);
	};

	const saveRow = (index: number) => {
		console.log("Guardando fila:", rows[index]);
		// Aquí iría el POST/PUT al servidor
	};

	const saveAllRows = (onSaveData: (data: string) => void) => {
		console.log("Guardando todas las filas:", rows);
		onSaveData(JSON.stringify(rows));
	};

	const setPrevious = (prevRows: T[]) => {
		setRows(prevRows);
	};

	return {
		rows,
		addRow,
		updateRow,
		saveRow,
		saveAllRows,
		setPrevious,
	};
}

export default useEditableTable;
