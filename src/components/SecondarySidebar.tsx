import { FC } from "react";
import { twMerge } from "tailwind-merge";
import ToolBar from "./ToolBar";

const SecondarySidebar: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        "max-w-64 w-full h-full overflow-auto border-l dark:border-slate-700 bg-white dark:bg-slate-950 flex flex-col gap-2",
        className ?? ""
      )}
    >
      <div className="flex size-full flex-col overflow-auto">
        <ToolBar className="w-full border-b justify-end"/>
        <div className="flex flex-col gap-2 px-2 pb-2"></div>
      </div>
    </div>
  );
};

export default SecondarySidebar;
