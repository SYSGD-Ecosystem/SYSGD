import type { FC } from "react";
import { FaFileAlt } from "react-icons/fa";

const Loading: FC = () => {
  return (
    <div className="relative flex items-center justify-center">
      <div>
        <FaFileAlt className="text-slate-500 relative" />
      </div>
      <div className="size-10 border-t-2 border-slate-500 animate-spin rounded-3xl absolute"/>
    </div>
  );
};

export default Loading;
