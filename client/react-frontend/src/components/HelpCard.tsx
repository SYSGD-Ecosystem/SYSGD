import { FC } from "react";
import { IoInformationCircle } from "react-icons/io5";

const HelpCard: FC<{ title: string; content: string }> = ({
  title,
  content,
}) => {
  return (
    <div className="w-full border shadow dark:border-slate-500 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded overflow-hidden">
      <div className="p-2 border-b dark:border-slate-500 text-base font-medium flex items-center gap-2">
        <IoInformationCircle size={20} />
        {title}
      </div>
      <div className="p-2 text-sm font-light text-justify">{content}</div>
      <div className="p-2 justify-end flex">
        <button className="text-blue-500 text-xs">Saber mas...</button>
      </div>
    </div>
  );
};

export default HelpCard;
