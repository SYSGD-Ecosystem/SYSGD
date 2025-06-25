import { type FC, useEffect, useState } from "react";
import DocumentRetentionTable from "./DocumentRetentionTable";
import SecondarySidebar from "./SecondarySidebar";
import IconButton from "./IconButton";
import { IoFileTray, IoPrint } from "react-icons/io5";
import { IoIosAddCircle } from "react-icons/io";
import Dropdown, { type DropdownOptionProps } from "./Dropdown";
import Text from "./Text";
import ClassificationBoxTable from "./ClassificationBoxTable";
import useDialog from "../hooks/useDialog";
import CreateArchiving from "./dialogs/CreateArchive";
import useArchives from "../hooks/connection/useArchives";
import {
  FaFileAlt,
  FaFileExport,
  FaGhost,
} from "react-icons/fa";
import Loading from "./Loading";
import useExportTable from "../hooks/useExportTable";
import usePrint from "../hooks/usePrint";
import useAlertDialog from "../hooks/useAlertDialog";

const WorkSpace: FC<{ page: number }> = ({ page }) => {
  const { DialogComponent, openDialog, closeDialog } = useDialog();
  const { archives, error, loading } = useArchives();

  const [archivesDropdown, setArchivesDropdown] = useState<
    DropdownOptionProps[]
  >([
    {
      Icon: IoFileTray,
      label: "--- Seleccionar Archivo de Gestón",
      onClick: () => {},
    },
  ]);

  const [archiveId, setArchiveId] = useState("");
  const [selectCode, setSelectCode] = useState("");
  const [archiveName, setArchiveName] = useState("");
  const [company, setCompany] = useState("");
  const { exportToXlsx } = useExportTable();
  const { print } = usePrint();

  const {
    AlertDialogComponent: DialogComponentExport,
    openDialog: openDialogExport,
  } = useAlertDialog();
  const dialogPrint = useAlertDialog();

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
      })
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
            <Dropdown options={archivesDropdown} />
            <IconButton
              Icon={IoIosAddCircle}
              onClick={openDialog}
              tooltip="Nuevo Archivo de Gestión"
              variant={2}
            />
            <IconButton
              Icon={IoPrint}
              onClick={dialogPrint.openDialog}
              tooltip="Imprimir"
              variant={2}
            />
            <IconButton
              Icon={FaFileExport}
              onClick={openDialogExport}
              tooltip="Exportar"
              variant={2}
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
              <DocumentRetentionTable
                company={company}
                managementFile={archiveName}
                data={[
                  {
                    code: "",
                    document: "",
                  },
                ]}
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
        <CreateArchiving onClose={closeDialog} />
      </DialogComponent>
      {DialogComponentExport(
        exportToXlsx,
        "¿Desea exportar este documento a Excel?"
      )}
      {dialogPrint.AlertDialogComponent(
        print,
        "¿Desea imprimir este documento?"
      )}
    </div>
  );
};

export default WorkSpace;
