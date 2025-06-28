import type { FC } from "react";
import IconButton from "./IconButton";
import { FaHome, FaSitemap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const NavBar: FC = () => {
  const navigate = useNavigate()
  return (
    <div className="w-12 max-w-12 min-w-12 items-center size-full border-r border-slate-400 flex gap-1 flex-col bg-slate-500 dark:bg-slate-800 dark:border-slate-700">
      <IconButton
        Icon={FaHome}
        tooltip="Inicio"
        onClick={() => {}}
        variant={1}
      />
      <IconButton
        Icon={FaSitemap}
        tooltip="Organigrama"
        onClick={() => {navigate("/organigrama")}}
        variant={1}
      />
    </div>
  );
};

export default NavBar;
