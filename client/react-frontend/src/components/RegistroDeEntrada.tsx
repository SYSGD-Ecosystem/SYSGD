import { useEffect, type FC } from "react";
import { Button } from "./ui/button";
import { AlertCircle, FileIcon, Plus, SaveAll } from "lucide-react";
import useEditableTable from "@/hooks/useEditableTable";
import Table, { Td } from "./BasicTableComponents";
import useConnection from "@/hooks/connection/useConnection";
import useGetEntryRegister from "@/hooks/connection/useGetEntryRegister";
import { useToast } from "@/hooks/use-toast";
import Loading from "./Loading";

export type RegistroDeEntradaData = {
	numero_registro: string;
	fecha: string;
	tipo_documento: string;
	sujeto_productor: string;
	titulo: string;
	observaciones?: string;
};

export type RegistroDeEntradaProps = {
	archiveId: string;
	company: string;
	managementFile: string;
};

const RegistroDeEntrada: FC<RegistroDeEntradaProps> = ({
	archiveId,
	company,
	managementFile,
}) => {
	const { rows, addRow, updateRow, saveAllRows, setPrevious } =
		useEditableTable<RegistroDeEntradaData>([
			{
				numero_registro: "",
				fecha: "",
				tipo_documento: "",
				sujeto_productor: "",
				titulo: "",
				observaciones: "",
			},
		]);
	const { handleNewDocumentEntry } = useConnection();
	const { entry, error, loading } = useGetEntryRegister(archiveId);
	const { toast } = useToast();

	const handleSaveData = (data: string) => {
		if (!data) {
			alert("No hay datos para guardar");
			return;
		}
		handleNewDocumentEntry(
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
		if (entry) {
			entry.map((props: { entry_register: RegistroDeEntradaData[] }) => {
				setPrevious(props.entry_register);
			});
		}
	}, [entry, archiveId]);

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
											<div className="w-full text-right"> A2</div>
										</div>
									</th>
								</tr>
								<tr>
									<th
										colSpan={11}
										className="text-center py-2 text-base uppercase"
									>
										<div>REGISTRO DE ENTRADA DE DOCUMENTOS</div>
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
												label={props.numero_registro}
												onBlur={(e) => {
													updateRow(
														index,
														"numero_registro",
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
												label={props.tipo_documento}
												onBlur={(e) => {
													updateRow(
														index,
														"tipo_documento",
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
												label={props.titulo}
												onBlur={(e) => {
													updateRow(index, "titulo", e.currentTarget.innerText);
												}}
											/>
											<Td
												label={props.observaciones ?? ""}
												onBlur={(e) => {
													updateRow(
														index,
														"observaciones",
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

export default RegistroDeEntrada;

const TableHeading: FC = () => {
	return (
		<>
			<tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
				<th className="p-2 border dark:border-gray-700">No. Reg. Entrada</th>
				<th className="p-2 border dark:border-gray-700 text-left">Fecha</th>
				<th className="p-2 border dark:border-gray-700 text-center">
					Tipo de Documento
				</th>
				<th className="p-2 border dark:border-gray-700 text-center">
					Sujeto Productor
				</th>
				<th className="p-2 border dark:border-gray-700 text-center w-full">
					Título
				</th>
				<th className="p-2 border dark:border-gray-700 text-center w-full">
					Observaciones
				</th>
			</tr>
		</>
	);
};
/*
const TableRow: FC<RegistroDeEntradaData> = ({
	numero_registro,
	fecha,
	tipo_documento,
	titulo,
	sujeto_productor,
	observaciones,
}) => {
	return (
		<tr className="">
			<Td label={numero_registro} />
			<Td label={fecha} />
			<Td label={tipo_documento} />
			<Td label={sujeto_productor} />
			<Td label={titulo} />
			<Td label={observaciones ?? ""} />
		</tr>
	);
};*/
