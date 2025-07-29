import { useEffect, type FC } from "react";
import { Button } from "../ui/button";
import { AlertCircle, FileIcon, Plus, SaveAll } from "lucide-react";
import useEditableTable from "@/hooks/useEditableTable";
import Table, { Td } from "../BasicTableComponents";
import useConnection from "@/hooks/connection/useConnection";
import { useToast } from "@/hooks/use-toast";
import useGetLoanRegister from "@/hooks/connection/useGetLoanRegister";
import type { LoanRegisterData } from "@/types/LoanRegister";
import Loading from "../Loading";

export type LoanRegisterProps = {
	archiveId: string;
	company: string;
	managementFile: string;
};

const LoanRegister: FC<LoanRegisterProps> = ({
	archiveId,
	company,
	managementFile,
}) => {
	const { rows, addRow, updateRow, saveAllRows, setPrevious } =
		useEditableTable<LoanRegisterData>([
			{
				no_orden: "",
				fecha_prestamo: "",
				oficina_solicitante: "",
				signatura_ao: "",
				signatura_ac: "",
				descripcion_documento: "",
				fecha_devolucion: "",
				observaciones: "",
			},
		]);

	const { handleNewDocumentLoan } = useConnection();
	const { loan, error, loading } = useGetLoanRegister(archiveId);
	const { toast } = useToast();

	const handleSaveData = (data: string) => {
		if (!data) {
			alert("No hay datos para guardar");
			return;
		}
		handleNewDocumentLoan(
			data,
			archiveId,
			() => {
				toast({
					title: "Guardado",
					description: "Los cambios se guardaron correctamente.",
				});
			},
			() => {
				toast({
					variant: "destructive",
					title: "Error",
					description: "Algo salió mal. Inténtalo de nuevo.",
				});
			},
		);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (loan && Array.isArray(loan)) {
			// Combina todos los loan_register en uno plano
			const allRegisters = loan
				.filter((item) => Array.isArray(item.loan_register))
				.flatMap((item) => item.loan_register);

			if (allRegisters.length > 0) {
				setPrevious(allRegisters);
			}
		}
	}, [loan, archiveId]);

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
											<div className="w-full text-right"> A5</div>
										</div>
									</th>
								</tr>
								<tr>
									<th
										colSpan={11}
										className="text-center py-2 text-base uppercase"
									>
										REGISTRO DE PRÉSTAMO DE DOCUMENTOS
									</th>
								</tr>
								<tr>
									<th colSpan={6} className="text-left py-2 text-sm uppercase">
										<div>
											Entidad: <span className="font-normal">{company}</span>
										</div>
										<div>
											Oficina Productora:{" "}
											<span className="font-normal">{managementFile}</span>
										</div>
									</th>
								</tr>
								<TableHeading />
							</thead>
							<tbody>
								{rows.map((props, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									<tr key={index}>
										<Td
											label={props.no_orden}
											onBlur={(e) =>
												updateRow(index, "no_orden", e.currentTarget.innerText)
											}
										/>
										<Td
											label={props.fecha_prestamo}
											onBlur={(e) =>
												updateRow(
													index,
													"fecha_prestamo",
													e.currentTarget.innerText,
												)
											}
										/>
										<Td
											label={props.oficina_solicitante}
											onBlur={(e) =>
												updateRow(
													index,
													"oficina_solicitante",
													e.currentTarget.innerText,
												)
											}
										/>
										<Td
											label={props.signatura_ao}
											onBlur={(e) =>
												updateRow(
													index,
													"signatura_ao",
													e.currentTarget.innerText,
												)
											}
										/>
										<Td
											label={props.signatura_ac}
											onBlur={(e) =>
												updateRow(
													index,
													"signatura_ac",
													e.currentTarget.innerText,
												)
											}
										/>
										<Td
											label={props.descripcion_documento}
											onBlur={(e) =>
												updateRow(
													index,
													"descripcion_documento",
													e.currentTarget.innerText,
												)
											}
										/>
										<Td
											label={props.fecha_devolucion}
											onBlur={(e) =>
												updateRow(
													index,
													"fecha_devolucion",
													e.currentTarget.innerText,
												)
											}
										/>
										<Td
											label={props.observaciones}
											onBlur={(e) =>
												updateRow(
													index,
													"observaciones",
													e.currentTarget.innerText,
												)
											}
										/>
									</tr>
								))}
							</tbody>
						</Table>

						<div className="flex items-center gap-2 flex-wrap mt-2">
							<Button onClick={addRow} size="sm" variant="outline">
								<Plus className="w-4 h-4 mr-1" />
								Fila
							</Button>

							<Button
								onClick={() => {
									saveAllRows(handleSaveData);
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

export default LoanRegister;

const TableHeading: FC = () => (
	<tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
		<th className="p-2 border dark:border-gray-700 min-w-20">No. Orden</th>
		<th className="p-2 border dark:border-gray-700 min-w-20">Fecha Préstamo</th>
		<th className="p-2 border dark:border-gray-700 min-w-28">
			Oficina Solicitante
		</th>
		<th className="p-2 border dark:border-gray-700 min-w-20">Signatura AO</th>
		<th className="p-2 border dark:border-gray-700 min-w-20">Signatura AC</th>
		<th className="p-2 border dark:border-gray-700 w-full">
			Descripción Documento
		</th>
		<th className="p-2 border dark:border-gray-700 min-w-24">
			Fecha Devolución
		</th>
		<th className="p-2 border dark:border-gray-700 w-full">Observaciones</th>
	</tr>
);
