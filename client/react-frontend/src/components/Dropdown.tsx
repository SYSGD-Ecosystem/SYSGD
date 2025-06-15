import { type FC, useState } from "react";
import { type IconType } from "react-icons";
import { IoIosArrowDown } from "react-icons/io";

export type DropdownProps = {
  options: DropdownOptionProps[];
};

const Dropdown: FC<DropdownProps> = ({ options }) => {
  const [isDropdownOptionVisibility, setIsDropdownOptionVisibility] =
    useState(false);

  const [label, setLabel] = useState(options[0].label);
  const [indexIcon, setIndexIcon] = useState(0);

  return (
    <div className="relative w-full inline-block">
      <button
        onClick={() => {
          setIsDropdownOptionVisibility(!isDropdownOptionVisibility);
        }}
        type="button"
        className="flex w-full h-7 cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-100 dark:bg-slate-700 p-2 text-sm dark:text-slate-300"
      >
        <DropdownIcon Icon={options[indexIcon].Icon} />

        <div className="w-full text-left">{label}</div>

        <IoIosArrowDown />
      </button>

      <div
        className={
          "absolute w-full rounded-lg bg-slate-100 dark:bg-slate-950 shadow-2xl " +
          (isDropdownOptionVisibility ? "inline-block" : "hidden")
        }
      >
        {options.map((option, index) => (
          <DropdownOption
            label={option.label}
            Icon={option.Icon}
            key={index}
            onClick={() => {
              setIndexIcon(index);
              setLabel(option.label);
              setIsDropdownOptionVisibility(false);
              option.onClick();
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Dropdown;

type DropdownOptionProps = {
  Icon: IconType;
  label: string;
  onClick: () => void;
};

const DropdownOption: FC<DropdownOptionProps> = ({ Icon, label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full dark:text-slate-300 cursor-pointer items-center justify-center gap-2 bg-transparent p-2 text-left text-sm hover:dark:bg-slate-800"
    >
      <Icon size={20} />

      <div className="w-full">{label}</div>
    </button>
  );
};

type DropdownIconProps = {
  Icon: IconType;
};

const DropdownIcon: FC<DropdownIconProps> = ({ Icon }) => {
  return <Icon size={20} />;
};
