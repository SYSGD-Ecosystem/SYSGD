import { useEffect, useState, type FC } from "react";
import { Button } from "./ui/button";
import { Plus, SaveAll } from "lucide-react";
import useEditableTable from "@/hooks/useEditableTable";
import Table, { Td } from "./BasicTableComponents";
import useConnection from "@/hooks/connection/useConnection";
import useCurrentUser from "@/hooks/connection/useCurrentUser";

export type RegistroDeEntradaData = {
	numero_registro: string;
	fecha: string;
	tipo_documento: string;
	sujeto_productor: string;
	titulo: string;
	observaciones?: string;
};

export type RegistroDeEntradaProps = {
	data: RegistroDeEntradaData[];
	company: string;
	managementFile: string;
};

const RegistroDeEntrada: FC<RegistroDeEntradaProps> = ({
	data,
	company,
	managementFile,
}) => {
	const { rows, addRow, updateRow, saveAllRows, setPrevious } =
		useEditableTable(data);
	const { handleNewDocumentEntry } = useConnection();
	const {user} = useCurrentUser()

	const handleSaveData = (data: string) => {
		console.log(data)
		//handleNewDocumentEntry(data,user?.id);
	};

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
								{rows.map((props, _index) => {
									return (
										<TableRow
											{...props}
											key={props.numero_registro + props.fecha}
										/>
									);
								})}
							</tbody>
						</Table>

						<div className="flex items-center gap-2 flex-wrap mt-2">
							<Button onClick={addRow} size="sm" variant="outline">
								<Plus className="w-4 h-4 mr-1" />
								Fila
							</Button>

							<Button onClick={() => {
								saveAllRows(handleSaveData)
							}} size="sm" variant="outline">
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
};
