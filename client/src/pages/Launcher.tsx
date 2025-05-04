import { FC } from "react";
import { IoApps } from "react-icons/io5";

const Launcher: FC = () => {
  return (
    <div className="bg-blue-500 h-screen flex flex-col items-center justify-center">
    <div className="size-full"></div>
      <div className="w-full h-10 bg-slate-400 opacity-75 flex items-center">
        <div className="w-full"><IoApps/></div>
        <div className="w-20">06:42 PM</div>
      </div>
    </div>
  );
};

export default Launcher;
