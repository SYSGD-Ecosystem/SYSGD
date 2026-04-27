import { Edit3 } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { FaFileAlt, FaFileExport, FaGhost } from "react-icons/fa";
import { IoIosAddCircle } from "react-icons/io";
import { IoPrint } from "react-icons/io5";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useArchivesApi } from "@/hooks/connection/useArchivesApi";
import { useArchiveStore } from "@/store/useArchiveStore";
import useArchives from "../../hooks/connection/useArchives";
import useAlertDialog from "../../hooks/useAlertDialog";
import useDialog from "../../hooks/useDialog";
import useExportTable from "../../hooks/useExportTable";
import usePrint from "../../hooks/usePrint";
import type { DropdownOptionProps } from "../Dropdown";
import CreateArchiving from "../dialogs/CreateArchive";
import IconButton from "../IconButton";
import Loading from "../Loading";
import Text from "../Text";
import ClassificationBoxTable from "./ClassificationBoxTable";
import ExitRegister from "./ExitRegister";
import LoanRegister from "./LoanRegister";
import RegistroDeEntrada from "./RegistroDeEntrada";
import RetentionScheduleTable from "./RetentionScheduleTable";
import SecondarySidebar from "./SecondarySidebar";
import TopographicRegister from "./TopographicRegister";

const WorkSpace: FC<{ page: number }> = ({ page }) => {
	const { DialogComponent, openDialog, closeDialog } = useDialog();
	const { archives, error, loading, reloadArchives } = useArchives();
	const { deleteArchive } = useArchivesApi();
	const [archivesDropdown, setArchivesDropdown] = useState<
		{ Icon: FC; label: string; onClick: () => void }[]
	>([]);

	const { selectedArchiveId, selectedArchiveInfo } = useArchiveStore();

	const [archiveId, setArchiveId] = useState(selectedArchiveId ?? "");
	const [selectCode, setSelectCode] = useState(selectedArchiveInfo.code ?? "");
	const [archiveName, setArchiveName] = useState(
		selectedArchiveInfo.name ?? "",
	);
	const [company, setCompany] = useState(selectedArchiveInfo.company ?? "");
	const { exportToXlsx } = useExportTable();
	const { print } = usePrint();

	const {
		AlertDialogComponent: DialogComponentExport,
		openDialog: openDialogExport,
	} = useAlertDialog();
	const dialogPrint = useAlertDialog();

	const dialogDelete = useAlertDialog();

	useEffect(() => {
		const dropdownArchives: DropdownOptionProps[] = archives.map(
			(archive: {
				id: string;
				code: string;
				company: string;
				name: string;
			}) => ({
				Icon: FaFileAlt,
				label: archive.name,
				onClick: () => {
					setArchiveId(archive.id);
					setSelectCode(archive.code);
					setArchiveName(archive.name);
					setCompany(archive.company);
				},
			}),
		);

		if (dropdownArchives.length !== 0) {
			setArchivesDropdown(dropdownArchives);
		}
	}, [archives]);

	if (error) {
		return (
			<div className="flex flex-col size-full bg-slate-200 dark:bg-slate-950 items-center justify-center">
				<Text variant={0} label="Error de Conexión" />
				<Text variant={0} label={error} />
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
		<div className="flex flex-col size-full bg-slate-200 dark:bg-slate-950">
			<div className="flex size-full">
				<div className="flex size-full flex-col overflow-auto">
					<div className="w-full h-10 flex gap-1 min-h-10 border-b border-slate-200 items-center justify-center px-2 bg-white dark:bg-slate-900 dark:border-t dark:border-slate-800">
						<Text
							className="shrink-0 w-max font-normal text-sm"
							label="Archivo de Gestión:"
							variant={1}
						/>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
								<button className="flex w-full h-7 cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-100 dark:bg-slate-700 p-2 text-sm dark:text-slate-300 ">
									<span className="truncate max-w-[150px] sm:max-w-xs">
										{archiveName || "Seleccionar Archivo de Gestión"}
									</span>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								{archivesDropdown.map((option, idx) => (
									<DropdownMenuItem
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										key={idx}
										onClick={option.onClick}
										className="flex items-center gap-2"
									>
										<option.Icon />
										<span className="truncate w-full">{option.label}</span>
										<IconButton
											Icon={Edit3}
											onClick={() => {
												// Lógica para editar el archivo de gestión
												// Por ejemplo: openEditDialog(archive.id)
											}}
											tooltip="Editar"
										/>
										<IconButton
											Icon={() => <span className="text-red-500">✕</span>}
											onClick={() => {
												dialogDelete.openDialog();
												reloadArchives();
											}}
											tooltip="Eliminar"
										/>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
						<IconButton
							Icon={IoIosAddCircle}
							onClick={openDialog}
							tooltip="Nuevo Archivo de Gestión"
						/>
						<IconButton
							Icon={IoPrint}
							onClick={dialogPrint.openDialog}
							tooltip="Imprimir"
						/>
						<IconButton
							Icon={FaFileExport}
							onClick={openDialogExport}
							tooltip="Exportar"
						/>
					</div>

					<div className="size-full flex overflow-auto">
						{page === 0 ? (
							<ClassificationBoxTable
								archiveId={archiveId}
								code={selectCode}
								company={company}
								archiveName={archiveName}
							/>
						) : page === 1 ? (
							<RetentionScheduleTable
								archiveId={archiveId}
								company={company}
								managementFile={archiveName}
							/>
						) : page === 2 ? (
							<RegistroDeEntrada
								archiveId={archiveId}
								company={company}
								managementFile={archiveName}
							/>
						) : page === 3 ? (
							<ExitRegister
								archiveId={archiveId}
								company={company}
								managementFile={archiveName}
							/>
						) : page === 4 ? (
							<LoanRegister
								archiveId={archiveId}
								company={company}
								managementFile={archiveName}
							/>
						) : page === 5 ? (
							<TopographicRegister
								archiveId={archiveId}
								company={company}
								managementFile={archiveName}
							/>
						) : (
							<div className="text-slate-700 text-xl font-light dark:text-slate-300 flex items-center justify-center flex-col gap-2 size-full">
								<FaGhost size={48} />
								<span className="">Modulo en construcción</span>
							</div>
						)}
					</div>
				</div>
				<SecondarySidebar className="" />
			</div>
			<DialogComponent>
				<CreateArchiving onClose={closeDialog} onCreate={reloadArchives} />
			</DialogComponent>
			{DialogComponentExport(
				exportToXlsx,
				"¿Desea exportar este documento a Excel?",
			)}
			{dialogPrint.AlertDialogComponent(
				print,
				"¿Desea imprimir este documento?",
			)}
			{dialogDelete.AlertDialogComponent(() => {
				deleteArchive(archiveId);
				//TODO: Actualizar tras la eliminacion
			}, `Desea eliminar el archivo de gestion ${archiveName}`)}
		</div>
	);
};

export default WorkSpace;
