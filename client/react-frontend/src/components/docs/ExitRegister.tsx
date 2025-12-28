import { AlertCircle, FileIcon, Plus, SaveAll } from "lucide-react";
import { type FC, useEffect } from "react";
import useConnection from "@/hooks/connection/useConnection";
import useGetExitRegister from "@/hooks/connection/useGetExitRegister";
import { useToast } from "@/hooks/use-toast";
import useEditableTable from "@/hooks/useEditableTable";
import Table, { Td } from "../BasicTableComponents";
import Loading from "../Loading";
import { Button } from "../ui/button";

export type ExitRegisterData = {
	no_exit_register: string;
	fecha: string;
	no_registro_entrada: string;
	serie_documental: string;
	sujeto_productor: string;
	causa_de_salida: string;
};

export type ExitRegisterProps = {
	archiveId: string;
	company: string;
	managementFile: string;
};

const ExitRegister: FC<ExitRegisterProps> = ({
	archiveId,
	company,
	managementFile,
}) => {
	const { rows, addRow, updateRow, saveAllRows, setPrevious } =
		useEditableTable<ExitRegisterData>([
			{
				no_exit_register: "",
				fecha: "",
				no_registro_entrada: "",
				serie_documental: "",
				sujeto_productor: "",
				causa_de_salida: "",
			},
		]);
	const { handleNewDocumentExit } = useConnection();
	const { exit, error, loading } = useGetExitRegister(archiveId);
	const { toast } = useToast();

	const handleSaveData = (data: string) => {
		if (!data) {
			alert("No hay datos para guardar");
			return;
		}
		handleNewDocumentExit(
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
		if (exit && Array.isArray(exit)) {
			// Combina todos los exit_register de cada objeto en un solo array
			const allRegisters = exit
				.filter((item) => Array.isArray(item.exit_register))
				.flatMap((item) => item.exit_register);

			if (allRegisters.length > 0) {
				setPrevious(allRegisters);
			} else {
				setPrevious([
					{
						no_exit_register: "",
						fecha: "",
						no_registro_entrada: "",
						serie_documental: "",
						sujeto_productor: "",
						causa_de_salida: "",
					},
				]);
			}
		}
	}, [exit, archiveId]);

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
							<thead className="">
								<tr>
									<th colSpan={11} className="py-2">
										<div className="flex">
											<div className="w-full">ANEXO</div>
											<div className="w-full text-right"> A4</div>
										</div>
									</th>
								</tr>
								<tr>
									<th
										colSpan={11}
										className="text-center py-2 text-base uppercase"
									>
										<div>REGISTRO DE SALIDA DE DOCUMENTOS</div>
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
								{rows.map((props, index) => {
									return (
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										<tr key={index}>
											<Td
												label={props.no_exit_register}
												onBlur={(e) => {
													updateRow(
														index,
														"no_exit_register",
														e.currentTarget.innerText,
													);
												}}
											/>
											<Td
												label={props.fecha}
												onBlur={(e) => {
													updateRow(index, "fecha", e.currentTarget.innerText);
												}}
											/>
											<Td
												label={props.no_registro_entrada}
												onBlur={(e) => {
													updateRow(
														index,
														"no_registro_entrada",
														e.currentTarget.innerText,
													);
												}}
											/>
											<Td
												label={props.serie_documental}
												onBlur={(e) => {
													updateRow(
														index,
														"serie_documental",
														e.currentTarget.innerText,
													);
												}}
											/>
											<Td
												label={props.sujeto_productor}
												onBlur={(e) => {
													updateRow(
														index,
														"sujeto_productor",
														e.currentTarget.innerText,
													);
												}}
											/>

											<Td
												label={props.causa_de_salida}
												onBlur={(e) => {
													updateRow(
														index,
														"causa_de_salida",
														e.currentTarget.innerText,
													);
												}}
											/>
										</tr>
									);
								})}
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

export default ExitRegister;

const TableHeading: FC = () => {
	return (
		<>
			<tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
				<th className="p-2 border dark:border-gray-700 min-w-20">
					No. Reg. Salida
				</th>
				<th className="p-2 border dark:border-gray-700 text-left min-w-20">
					Fecha
				</th>
				<th className="p-2 border dark:border-gray-700 text-center min-w-20">
					No. Reg. Entr.
				</th>
				<th className="p-2 border dark:border-gray-700 text-center w-full">
					Serie Documental
				</th>
				<th className="p-2 border dark:border-gray-700 text-center min-w-20">
					Sujeto Productor
				</th>
				<th className="p-2 border dark:border-gray-700 text-center min-w-20">
					Causa de Salida
				</th>
			</tr>
		</>
	);
};
