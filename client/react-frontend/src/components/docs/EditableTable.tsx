import type React from "react";
import useEditableTable from "../../hooks/useEditableTable";

const EditableTable: React.FC = () => {
	const { rows, addRow, updateRow, saveRow } = useEditableTable([
		{ field1: "", field2: "" },
	]);

	return (
		<div className="w-full max-w-3xl mx-auto">
			<table className="min-w-full border-collapse">
				<thead>
					<tr>
						<th className="border p-2">Campo 1</th>
						<th className="border p-2">Campo 2</th>
						<th className="border p-2">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<tr key={index}>
							<td
								className="border p-2"
								contentEditable
								suppressContentEditableWarning
								onBlur={(e) =>
									updateRow(index, "field1", e.currentTarget.innerText)
								}
							>
								{row.field1}
							</td>
							<td
								className="border p-2"
								contentEditable
								suppressContentEditableWarning
								onBlur={(e) =>
									updateRow(index, "field2", e.currentTarget.innerText)
								}
							>
								{row.field2}
							</td>
							<td className="border p-2">
								{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
								<button
									onClick={() => saveRow(index)}
									className="bg-blue-500 text-white py-1 px-3 rounded"
								>
									Guardar
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
			<button
				onClick={addRow}
				className="mt-4 bg-green-500 text-white py-2 px-4 rounded"
			>
				Añadir Fila
			</button>
		</div>
	);
};

export default EditableTable;
