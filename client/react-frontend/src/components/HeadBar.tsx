import type { FC } from "react";
import IconButton, { VariantIconButton } from "./IconButton";
import { IoNotifications, IoPerson } from "react-icons/io5";
import { IoIosApps } from "react-icons/io";
import ButtonSwitchTheme from "./ButtonSwitchTheme";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const HeadBar: FC = () => {
  const navigate = useNavigate()
  return (
    <div className="w-full min-h-11 bg-slate-600 dark:bg-slate-900 items-center px-2 flex">
      <div className="w-full flex items-center gap-1">
        <div>
          <IoIosApps size={24} color="white" />
        </div>
        <div className="text-white w-full text-lg font-medium">SYSGD</div>
      </div>
      <ButtonSwitchTheme />
      <IconButton
        variant={VariantIconButton.dark}
        tooltip="Notificaciones"
        Icon={IoNotifications}
        onClick={() => toast("No hay notificaciones", { icon: "🔔" })}
      />
      <IconButton
        variant={VariantIconButton.dark}
        tooltip="Cuenta"
        Icon={IoPerson}
        onClick={() => {navigate("/perfil")}}
      />
    </div>
  );
};

export default HeadBar;
