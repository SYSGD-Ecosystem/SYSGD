import { FC } from "react";
import { IconType } from "react-icons";

export type BarButtonProps = {
  label: string;
  onClick: () => void;
  Icon: IconType;
};

const BarButton: FC<BarButtonProps> = ({ label, onClick, Icon }) => {
  return (
    <button
      title={label}
      onClick={onClick}
      className="p-2 uppercase text-slate-100 dark:text-slate-300 hover:bg-slate-400 dark:hover:bg-slate-700 w-full text-left text-xs font-medium flex gap-2 items-center"
    >
      <Icon /> <span className="line-clamp-1">{label}</span>
    </button>
  );
};

export default BarButton;
