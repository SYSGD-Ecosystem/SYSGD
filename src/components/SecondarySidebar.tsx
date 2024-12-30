import { FC } from "react";
import { twMerge } from "tailwind-merge";
import ToolBar from "./ToolBar";
import { spanish } from "../lang/spanish";
import HelpCard from "./HelpCard";

const SecondarySidebar: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        "max-w-64 w-full h-full overflow-auto border-l dark:border-slate-700 bg-white dark:bg-slate-950 lg:flex flex-col gap-2 hidden",
        className ?? ""
      )}
    >
      <div className="flex size-full flex-col overflow-auto">
        <ToolBar className="w-full border-y justify-end" />
        <div className="flex flex-col gap-2 p-2">
          <HelpCard title={spanish.code} content={spanish.help_document_code} />
        </div>
      </div>
    </div>
  );
};

export default SecondarySidebar;
