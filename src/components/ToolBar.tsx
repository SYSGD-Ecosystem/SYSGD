import { FC } from "react";
import useExportTable from "../hooks/useExportTable";
import usePrint from "../hooks/usePrint";
import IconButton from "./IconButton";
import { IoPrint } from "react-icons/io5";
import { IoIosHelpCircle, IoIosInformationCircle } from "react-icons/io";
import useAlertDialog from "../hooks/useAlertDialog";
import { FaFileExport } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

const ToolBar: FC<{ className?: string }> = ({ className }) => {
  const { exportToXlsx } = useExportTable();
  const { print } = usePrint();

  const { AlertDialogComponent: DialogComponent, openDialog } =
    useAlertDialog();
  const dialogPrint = useAlertDialog();

  return (
    <div className={twMerge( "w-max h-10 flex min-h-10 items-center dark:border-slate-700", className)}>
      <IconButton
        Icon={IoPrint}
        onClick={dialogPrint.openDialog}
        tooltip="Imprimir"
        variant={2}
      />
      <IconButton
        Icon={FaFileExport}
        onClick={openDialog}
        tooltip="Exportar"
        variant={2}
      />
      <IconButton
        Icon={IoIosInformationCircle}
        onClick={() => {}}
        tooltip="Detalles"
        variant={2}
      />
      <IconButton
        Icon={IoIosHelpCircle}
        onClick={() => {}}
        tooltip="Ayuda"
        variant={2}
      />
      {DialogComponent(exportToXlsx, "¿Desea exportar este documento a Excel?")}
      {dialogPrint.AlertDialogComponent(
        print,
        "¿Desea imprimir este documento?"
      )}
    </div>
  );
};

export default ToolBar;
