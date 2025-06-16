import { FC } from "react";
import { IconType } from "react-icons";
import { twMerge } from "tailwind-merge";

export type BarButtonProps = {
  label: string;
  onClick: () => void;
  Icon: IconType;
  isSelected: boolean;
};

const BarButton: FC<BarButtonProps> = ({
  label,
  onClick,
  Icon,
  isSelected,
}) => {
  return (
    <button
      title={label}
      onClick={onClick}
      className={twMerge(
        "p-2 uppercase text-slate-100 dark:text-slate-300 hover:bg-slate-400 dark:hover:bg-slate-700 w-full text-left text-xs font-medium flex gap-2 items-center",
        isSelected
          ? "border-l-4 border-red-500 bg-slate-400 dark:bg-slate-700"
          : ""
      )}
    >
      <Icon /> <span className="line-clamp-1">{label}</span>
    </button>
  );
};

export default BarButton;
