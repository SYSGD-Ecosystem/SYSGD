import { FC, HTMLAttributes } from "react";

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  isDisabled?: boolean;
}

const Button: FC<ButtonProps> = ({
  isDisabled,
  children,
  ...props
}) => {
  return (
    <button
      disabled={isDisabled}
      className="bg-slate-600 text-sm font-light uppercase py-1.5 rounded text-white hover:bg-slate-500 disabled:opacity-65 disabled:hover:bg-slate-600 disabled:cursor-not-allowed transition duration-500 min-w-32"
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
