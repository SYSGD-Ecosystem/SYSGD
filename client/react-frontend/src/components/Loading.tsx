import type { FC } from "react";
import { FaFileAlt } from "react-icons/fa";
import { Label } from "./ui/label";

const Loading: FC<{textLoading?:string}> = ({textLoading}) => {
  return (
    <div className="relative flex items-center justify-center">
      <div>
        <FaFileAlt className="text-slate-500 relative" />
      </div>
      <div className="size-10 border-t-2 border-slate-500 animate-spin rounded-3xl absolute"/>
      <Label className="dark:text-white mt-24 absolute text-center flex items-center justify-center">{textLoading ?? ""}</Label>
    </div>
  );
};

export default Loading;
