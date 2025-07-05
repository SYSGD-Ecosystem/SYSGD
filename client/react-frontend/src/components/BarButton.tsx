import type { FC } from "react";
import type { IconType } from "react-icons";
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
    // biome-ignore lint/a11y/useButtonType: <explanation>
<button
      title={label}
      onClick={onClick}
      className={twMerge(
        "p-2 uppercase text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 w-full text-left text-xs font-medium flex gap-2 items-center",
        isSelected
          ? "border-l-4 border-red-500 bg-slate-300 dark:bg-slate-700"
          : ""
      )}
    >
      <Icon /> <span className="line-clamp-1">{label}</span>
    </button>
  );
};

export default BarButton;
