import { type FC, useEffect } from "react";
import Table, { Td, type Row } from "./BasicTableComponents";
import useEditableTable from "../hooks/useEditableTable";
import { useToast } from "../hooks/useToast";
import useConnection from "../hooks/connection/useConnection";
import { spanish } from "../lang/spanish";
import useGetData from "../hooks/connection/useGetData";
import Loading from "./Loading";
import { IoAlertCircle } from "react-icons/io5";
import { FaFileAlt } from "react-icons/fa";
import { Button } from "./ui/button";
import { Plus, SaveAll } from "lucide-react";

export type ClassificationBoxTableData = {
	code: string;
	document: string;
};

export type ClassificationBoxTableProps = {
	archiveId: string;
	company: string;
	archiveName: string;
	code: string;
};

const ClassificationBoxTable: FC<ClassificationBoxTableProps> = ({
	archiveId,
	company,
	archiveName,
	code,
}) => {
	const { rows, addRow, updateRow, saveAllRows, setPrevious } =
		useEditableTable([{ field1: "", field2: "" }]);
	const { addToast: toast } = useToast();
	const { handleAddClassificationBoxData } = useConnection();

	const { data, error, loading } = useGetData(archiveId);

	const handleSaveData = (data: string) => {
		alert(archiveId);
		handleAddClassificationBoxData(
			archiveId,
			data,
			() => {
				toast(spanish.save_done, "positive");
			},
			() => {
				toast(spanish.save_error, "negative");
			},
		);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		data.map((props: { classification_chart: Row[] }) => {
			const getROWS: Row[] = props.classification_chart;
			if (getROWS !== null) {
				setPrevious(getROWS);
			} else {
				setPrevious([{ field1: "", field2: "" }]);
			}
		});
	}, [data]);

	if (error) {
		return (
			<div className="flex flex-col size-full bg-slate-200 dark:bg-slate-950 items-center justify-center">
				{error === "500" ? (
					<div className="flex flex-col text-xl text-red-500 items-center justify-center gap-2">
						<IoAlertCircle />
						<span>Internal Server Error</span>
					</div>
				) : (
					<div className="text-slate-700 text-xl font-light dark:text-slate-300 flex items-center justify-center flex-col gap-2">
						<FaFileAlt size={48} />
						<span className="">
							Por favor, Seleccione un Archivo de Gestión
						</span>
					</div>
				)}
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex flex-col size-full bg-slate-200 dark:bg-slate-950 items-center justify-center">
				<Loading />
			</div>
		);
	}

	return (
		<div className="w-full flex flex-col h-full overflow-auto">
			<div className="w-full flex justify-center p-2 items-center">
				<div className="bg-white dark:bg-slate-900 py-5 px-10 border dark:border-slate-700 flex flex-col shadow w-full max-w-[21.59cm] min-h-[27.54cm] rounded">
					<div id="content">
						<Table>
							<thead className="">
								<tr>
									<th colSpan={2} className="py-2">
										<div className="flex">
											<div className="w-full">{spanish.annex}</div>
											<div className="w-full text-right"> A1</div>
										</div>
									</th>
								</tr>
								<tr>
									<th
										colSpan={2}
										className="text-center py-2 text-base uppercase"
									>
										<div>Cuadro de Clasificación</div>
										<div>{company}</div>
									</th>
								</tr>
								<tr>
									<th colSpan={2} className="text-left py-2 text-sm uppercase">
										<div>
											Archivo de gestión:{" "}
											<span className="font-normal">
												{code} {archiveName}
											</span>
										</div>
										<div>Documentos generados</div>
									</th>
								</tr>
								<TableHeading />
							</thead>
							<tbody>
								{rows.map((row, index) => {
									return (
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										<tr key={index}>
											<Td
												label={row.field1}
												onBlur={(e) => {
													updateRow(index, "field1", e.currentTarget.innerText);
												}}
											/>
											<Td
												label={row.field2}
												onBlur={(e) => {
													updateRow(index, "field2", e.currentTarget.innerText);
												}}
											/>
										</tr>
									);
								})}
							</tbody>
						</Table>
						<div className="py-2 flex gap-2">
							<Button onClick={addRow} size="sm" variant="outline">
								<Plus className="w-4 h-4 mr-1" />
								{spanish.add_row}
							</Button>
							<Button
								onClick={() => {
									saveAllRows(handleSaveData);
									toast(spanish.save_done, "positive");
								}}
								size="sm"
								variant="outline"
							>
								<SaveAll className="w-4 h-4 mr-1" />
								Guardar
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ClassificationBoxTable;

const TableHeading: FC = () => {
	return (
		<tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
			<th className="p-2 border dark:border-gray-700 max-w-12">Código</th>
			<th className="p-2 border dark:border-gray-700">
				Series y Subseries Documentales
			</th>
		</tr>
	);
};
