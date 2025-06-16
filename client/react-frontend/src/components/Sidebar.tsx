import { FC, useEffect, useState } from "react";
import BarButton from "./BarButton";
import { IoArchive } from "react-icons/io5";
import IconButton from "./IconButton";
import { IoLogoFacebook, IoLogoGithub, IoLogoTwitter } from "react-icons/io";

type SidebarProps = {
  onOptionSelected: (option: number) => void;
};

const Sidebar: FC<SidebarProps> = ({ onOptionSelected }) => {
  const [option, setOption] = useState(0);
  useEffect(() => {
    onOptionSelected(option);
  }, [option]);

  return (
    <div className="w-full max-w-60 hidden dark:border-r dark:border-slate-700 h-full md:flex flex-col bg-slate-500 dark:bg-slate-800">
      <div className="size-full flex flex-col">
        <BarButton
          isSelected={option === 0}
          onClick={() => {
            setOption(0);
          }}
          Icon={IoArchive}
          label="Cuadro de clasificacón"
        />
        <BarButton
          isSelected={option === 1}
          onClick={() => {
            setOption(1);
          }}
          Icon={IoArchive}
          label="Tabla de Retencion Documental"
        />
        <BarButton
          isSelected={option === 2}
          onClick={() => {
            setOption(2);
          }}
          Icon={IoArchive}
          label="Registro de entrada"
        />
        <BarButton
          isSelected={option === 3}
          onClick={() => {
            setOption(3);
          }}
          Icon={IoArchive}
          label="Registro de Salida"
        />
        <BarButton
          isSelected={option === 4}
          onClick={() => {
            setOption(4);
          }}
          Icon={IoArchive}
          label="Registro de prestamo"
        />
        <BarButton
          isSelected={option === 5}
          onClick={() => {
            setOption(5);
          }}
          Icon={IoArchive}
          label="Registro topografico"
        />
      </div>
      <div className="flex items-center justify-center p-1 border-t border-slate-400 dark:border-slate-700">
        <div className="text-slate-100 font-normal text-base w-full">
          UNISOFT - CUBA
        </div>

        <IconButton
          variant={1}
          tooltip="GitHub"
          Icon={IoLogoGithub}
          onClick={() => {}}
        />
        <IconButton
          variant={1}
          tooltip="Facebook"
          Icon={IoLogoFacebook}
          onClick={() => {}}
        />
        <IconButton
          variant={1}
          tooltip="X"
          Icon={IoLogoTwitter}
          onClick={() => {}}
        />
      </div>
    </div>
  );
};

export default Sidebar;
