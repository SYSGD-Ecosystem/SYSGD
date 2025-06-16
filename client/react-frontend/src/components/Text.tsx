import { FC } from "react";
import { twMerge } from "tailwind-merge";

export enum Variant {
  Heading,
  Span,
}

export type TextProps = {
  label: string;
  variant?: Variant;
  className?: string;
};

const Text: FC<TextProps> = ({ label, variant = 1, className }) => {
  switch (variant) {
    case Variant.Heading:
      return (
        <h1
          className={twMerge(
            "text-lg font-semibold text-slate-900 dark:text-slate-100",
            className
          )}
        >
          {label}
        </h1>
      );
    case Variant.Span:
      return (
        <div
          className={twMerge(
            "text-base text-slate-900 dark:text-slate-100",
            className
          )}
        >
          {label}
        </div>
      );
  }
};

export default Text;
