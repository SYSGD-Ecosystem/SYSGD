import { FC } from "react";
import DocumentRetentionTable from "./DocumentRetentionTable";
import SecondarySidebar from "./SecondarySidebar";
import IconButton from "./IconButton";
import { IoFileTray } from "react-icons/io5";
import { IoIosAddCircle, IoIosAppstore, IoIosPeople } from "react-icons/io";
import Dropdown from "./Dropdown";
import Text from "../pages/Text";
import useAlertDialog from "../hooks/useAlertDialog";

const MainContainer: FC = () => {
  const { DialogComponent, openDialog } = useAlertDialog();

  return (
    <div className="flex flex-col size-full bg-slate-200 dark:bg-slate-950">
      <div className="flex size-full">
        <div className="flex size-full flex-col overflow-auto border-t dark:border-slate-800">
          <div className="w-full h-10 flex gap-1 min-h-10 border-b border-slate-200 items-center justify-center px-2 bg-white dark:bg-slate-900 dark:border-t dark:border-slate-800">
            <Text
              className="shrink-0 w-max font-normal text-sm"
              label="Archivo de Gestión:"
              variant={1}
            />
            <Dropdown
              options={[
                { Icon: IoFileTray, label: "Dirección", onClick: () => {} },
                { Icon: IoIosPeople, label: "RRHH", onClick: () => {} },
                { Icon: IoFileTray, label: "Economía", onClick: () => {} },
                { Icon: IoIosAppstore, label: "Ventas", onClick: () => {} },
              ]}
            />
            <IconButton
              Icon={IoIosAddCircle}
              onClick={openDialog}
              tooltip="Nuevo Archivo de Gestión"
              variant={2}
            />
          </div>

          <div className="size-full flex overflow-auto">
            <DocumentRetentionTable
              company="UNISOFT-CUBA"
              managementFile="Gestión Documental"
              data={[
                {
                  code: "OT37.1.5.1",
                  document: "Expediente gestión documental y archivos",
                },
              ]}
            />
          </div>
        </div>
        <SecondarySidebar />
      </div>
      {DialogComponent(() => {}, "¿Desea crear un nuevo archivo de gestión?")}
    </div>
  );
};

export default MainContainer;
