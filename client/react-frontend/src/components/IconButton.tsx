import { FC } from "react";
import { IconType } from "react-icons";

export enum VariantIconButton {
  light,
  dark,
  auto,
}

export type IconButtonProps = {
  tooltip: string;
  onClick: () => void;
  Icon: IconType;
  variant?: VariantIconButton;
};

const IconButton: FC<IconButtonProps> = ({
  onClick,
  Icon,
  tooltip,
  variant,
}) => {
  const buttonStyle =
    variant === VariantIconButton.dark
      ? "p-2 hover:bg-slate-500 text-slate-100 size-9 rounded-full text-xl flex items-center justify-center"
      : variant === VariantIconButton.light
      ? "p-2 hover:bg-slate-100 text-slate-600 size-9 rounded-full text-xl flex items-center justify-center"
      : "p-2 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 size-9 rounded-full text-xl flex items-center justify-center";
  return (
    <button title={tooltip} onClick={onClick} className={buttonStyle}>
      <Icon />
    </button>
  );
};

export default IconButton;
