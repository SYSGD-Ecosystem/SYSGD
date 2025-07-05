import type { FC } from "react";
import IconButton from "./IconButton";
import { IoIosHelpCircle } from "react-icons/io";
import { twMerge } from "tailwind-merge";
import Text from "./Text";

const ToolBar: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        "w-max h-10 flex min-h-10 items-center dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <Text label="Acerca de..." className="w-full px-2" />
      <IconButton
        Icon={IoIosHelpCircle}
        onClick={() => {}}
        tooltip="Detalles"
      />
    </div>
  );
};

export default ToolBar;
