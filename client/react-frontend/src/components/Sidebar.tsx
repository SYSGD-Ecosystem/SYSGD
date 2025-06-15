import { FC } from "react";
import BarButton from "./BarButton";
import { IoArchive } from "react-icons/io5";
import IconButton from "./IconButton";
import { IoLogoFacebook, IoLogoGithub, IoLogoTwitter } from "react-icons/io";

const Sidebar: FC = () => {
  return (
    <div className="w-60 min-w-60 h-full flex flex-col bg-slate-500 dark:bg-slate-800">
      <div className="size-full flex flex-col">
        <BarButton
          onClick={() => {}}
          Icon={IoArchive}
          label="Cuadro de clasificacón"
        />
        <BarButton
          onClick={() => {}}
          Icon={IoArchive}
          label="Tabla de Retencion Documental"
        />
        <BarButton
          onClick={() => {}}
          Icon={IoArchive}
          label="Registro de entrada"
        />
        <BarButton
          onClick={() => {}}
          Icon={IoArchive}
          label="Registro de Salida"
        />
        <BarButton
          onClick={() => {}}
          Icon={IoArchive}
          label="Registro de prestamo"
        />
        <BarButton
          onClick={() => {}}
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
