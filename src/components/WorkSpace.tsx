import { FC, useEffect, useState } from "react";
import DocumentRetentionTable from "./DocumentRetentionTable";
import SecondarySidebar from "./SecondarySidebar";
import IconButton from "./IconButton";
import { IoFileTray } from "react-icons/io5";
import { IoIosAddCircle } from "react-icons/io";
import Dropdown, { DropdownOptionProps } from "./Dropdown";
import Text from "./Text";
import ClassificationBoxTable from "./ClassificationBoxTable";
import useDialog from "../hooks/useDialog";
import CreateArchiving from "./dialogs/CreateArchive";
import useArchives from "../hooks/useArchives";
import { FaFileAlt } from "react-icons/fa";
import Loading from "./Loading";

const WorkSpace: FC<{ page: number }> = ({ page }) => {
  const { DialogComponent, openDialog, closeDialog } = useDialog();
  const { archives, error, loading } = useArchives();

  const [archivesDropdown, setArchivesDropdown] = useState<
    DropdownOptionProps[]
  >([{ Icon: IoFileTray, label: "default1", onClick: () => {} }]);

  const [selectCode, setSelectCode] = useState("");
  const [archiveName, setArchiveName] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    const dropdownArchives: DropdownOptionProps[] = archives.map(
      (archive: { code: string; company: string; name: string }) => ({
        Icon: FaFileAlt,
        label: archive.name,
        onClick: () => {
          setSelectCode(archive.code);
          setArchiveName(archive.name);
          setCompany(archive.company);
        },
      })
    );

    if (dropdownArchives.length !== 0) {
      setArchivesDropdown(dropdownArchives);
    }

    console.log(dropdownArchives);
    console.log(archivesDropdown);
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
        <Loading/>
      </div>
    );
  }

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
            <Dropdown options={archivesDropdown} />
            <IconButton
              Icon={IoIosAddCircle}
              onClick={openDialog}
              tooltip="Nuevo Archivo de Gestión"
              variant={2}
            />
          </div>

          <div className="size-full flex overflow-auto">
            {page === 0 ? (
              <ClassificationBoxTable
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
              <></>
            )}
          </div>
        </div>
        <SecondarySidebar className="" />
      </div>
      <DialogComponent>
        <CreateArchiving onClose={closeDialog} />
      </DialogComponent>
    </div>
  );
};

export default WorkSpace;
