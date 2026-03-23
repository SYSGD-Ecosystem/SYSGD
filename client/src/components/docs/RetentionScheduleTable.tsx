import { AlertCircle, FileIcon, Plus, SaveAll } from "lucide-react";
import { type FC, useEffect } from "react";
import useConnection from "../../hooks/connection/useConnection";
import useGetRetentionSchedule from "../../hooks/connection/useGetRetentionSchedule";
import { useToast } from "../../hooks/use-toast";
import useEditableTable from "../../hooks/useEditableTable";
import type { RetentionScheduleData } from "../../types/RetentionSchedule";
import Table, { Td } from "../BasicTableComponents";
import Loading from "../Loading";
import { Button } from "../ui/button";

export interface RetentionScheduleProps {
	archiveId: string;
	company: string;
	managementFile: string;
}

const emptyRow: RetentionScheduleData = {
	codigo: "",
	serie_documental: "",
	valoracion_t: "",
	valoracion_p: "",
	soporte_p: "",
	soporte_d: "",
	acceso_l: "",
	acceso_r: "",
	plazo_ag: "",
	plazo_ac: "",
	observaciones: "",
};

const RetentionScheduleTable: FC<RetentionScheduleProps> = ({
	archiveId,
	company,
	managementFile,
}) => {
	const { rows, addRow, updateRow, saveAllRows, setPrevious } =
		useEditableTable<RetentionScheduleData>([emptyRow]);
	const { handleNewRetentionSchedule } = useConnection();
	const { schedule, error, loading } = useGetRetentionSchedule(archiveId);
	const { toast } = useToast();

	const handleSaveData = (data: string) => {
		if (!data) return;
		handleNewRetentionSchedule(
			data,
			archiveId,
			() => toast({ title: "Guardado" }),
			() =>
				toast({
					variant: "destructive",
					title: "Error",
					description: "No se pudo guardar la TRD",
				}),
		);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (schedule && schedule.length > 0) setPrevious(schedule);
	}, [schedule, archiveId]);

	if (error) {
		return (
			<div className="flex flex-col size-full bg-slate-200 dark:bg-slate-950 items-center justify-center">
				{error === "500" ? (
					<div className="flex flex-col text-xl text-red-500 items-center justify-center gap-2">
						<AlertCircle />
						<span>Internal Server Error</span>
					</div>
				) : (
					<div className="text-slate-700 text-xl font-light dark:text-slate-300 flex items-center justify-center flex-col gap-2">
						<FileIcon size={48} />
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
		<div className="size-full flex flex-col overflow-auto">
			<div className="w-full flex justify-center p-2 items-center">
				<div className="bg-white dark:bg-slate-900 py-5 px-10 border dark:border-slate-700 flex flex-col shadow w-full max-w-[21.59cm] min-w-[21.59cm] min-h-[27.54cm] rounded">
					<div id="content">
						<Table>
							<thead>
								<tr>
									<th colSpan={11} className="py-2">
										<div className="flex">
											<div className="w-full">ANEXO</div>
											<div className="w-full text-right"> A2</div>
										</div>
									</th>
								</tr>
								<tr>
									<th
										colSpan={11}
										className="text-center py-2 text-base uppercase"
									>
										TABLA DE RETENCIÓN DOCUMENTAL
									</th>
								</tr>
								<tr>
									<th colSpan={11} className="text-left py-2 text-sm uppercase">
										<div>
											Entidad: <span className="font-normal">{company}</span>
										</div>
										<div>
											Oficina Productora:{" "}
											<span className="font-normal">{managementFile}</span>
										</div>
									</th>
								</tr>
								{/* Encabezado de dos filas */}
								<tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
									<th
										rowSpan={2}
										className="p-2 border dark:border-gray-700 min-w-24"
									>
										Código
									</th>
									<th
										rowSpan={2}
										className="p-2 border dark:border-gray-700 min-w-44 text-left"
									>
										Series y Subseries Documentales
									</th>
									<th
										colSpan={2}
										className="p-2 border dark:border-gray-700 text-center"
									>
										Valoración
									</th>
									<th
										colSpan={2}
										className="p-2 border dark:border-gray-700 text-center"
									>
										Soporte
									</th>
									<th
										colSpan={2}
										className="p-2 border dark:border-gray-700 text-center"
									>
										Acceso
									</th>
									<th
										colSpan={2}
										className="p-2 border dark:border-gray-700 text-center"
									>
										Plazo de Retención
									</th>
									<th
										rowSpan={2}
										className="p-2 border dark:border-gray-700 min-w-32"
									>
										Observaciones
									</th>
								</tr>
								<tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
									<th className="p-2 border dark:border-gray-700">T</th>
									<th className="p-2 border dark:border-gray-700">P</th>
									<th className="p-2 border dark:border-gray-700">P</th>
									<th className="p-2 border dark:border-gray-700">D</th>
									<th className="p-2 border dark:border-gray-700">L</th>
									<th className="p-2 border dark:border-gray-700">R</th>
									<th className="p-2 border dark:border-gray-700">AG</th>
									<th className="p-2 border dark:border-gray-700">AC</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									<tr key={i}>
										<Td
											label={row.codigo}
											onBlur={(e) =>
												updateRow(i, "codigo", e.currentTarget.innerText)
											}
										/>
										<Td
											label={row.serie_documental}
											onBlur={(e) =>
												updateRow(
													i,
													"serie_documental",
													e.currentTarget.innerText,
												)
											}
										/>
										<Td
											label={row.valoracion_t}
											onBlur={(e) =>
												updateRow(i, "valoracion_t", e.currentTarget.innerText)
											}
										/>
										<Td
											label={row.valoracion_p}
											onBlur={(e) =>
												updateRow(i, "valoracion_p", e.currentTarget.innerText)
											}
										/>
										<Td
											label={row.soporte_p}
											onBlur={(e) =>
												updateRow(i, "soporte_p", e.currentTarget.innerText)
											}
										/>
										<Td
											label={row.soporte_d}
											onBlur={(e) =>
												updateRow(i, "soporte_d", e.currentTarget.innerText)
											}
										/>
										<Td
											label={row.acceso_l}
											onBlur={(e) =>
												updateRow(i, "acceso_l", e.currentTarget.innerText)
											}
										/>
										<Td
											label={row.acceso_r}
											onBlur={(e) =>
												updateRow(i, "acceso_r", e.currentTarget.innerText)
											}
										/>
										<Td
											label={row.plazo_ag}
											onBlur={(e) =>
												updateRow(i, "plazo_ag", e.currentTarget.innerText)
											}
										/>
										<Td
											label={row.plazo_ac}
											onBlur={(e) =>
												updateRow(i, "plazo_ac", e.currentTarget.innerText)
											}
										/>
										<Td
											label={row.observaciones}
											onBlur={(e) =>
												updateRow(i, "observaciones", e.currentTarget.innerText)
											}
										/>
									</tr>
								))}
							</tbody>
						</Table>
						<div className="flex items-center gap-2 flex-wrap mt-2">
							<Button onClick={addRow} size="sm" variant="outline">
								<Plus className="w-4 h-4 mr-1" /> Fila
							</Button>
							<Button
								onClick={() => saveAllRows(handleSaveData)}
								size="sm"
								variant="outline"
							>
								<SaveAll className="w-4 h-4 mr-1" /> Guardar
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RetentionScheduleTable;
