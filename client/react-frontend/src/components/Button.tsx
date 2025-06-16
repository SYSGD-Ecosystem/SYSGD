import { FC, HTMLAttributes } from "react";

export enum ButtonVariant {
  neutral,
  positive,
  negative,
}

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  isDisabled?: boolean;
  variant?: ButtonVariant;
}

const Button: FC<ButtonProps> = ({
  isDisabled,
  children,
  variant = 0,
  ...props
}) => {
  return (
    <button
      disabled={isDisabled}
      className={
        "text-sm font-light uppercase py-1.5 rounded text-white disabled:opacity-65 disabled:cursor-not-allowed transition duration-500 w-full max-w-28 " +
        (variant === 0
          ? "bg-slate-600 hover:bg-slate-500 disabled:hover:bg-slate-600"
          : variant === 1
          ? "bg-green-600 hover:bg-green-500 disabled:hover:bg-green-600"
          : "bg-red-600 hover:bg-red-500 disabled:hover:bg-red-600")
      }
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
