import type { FC } from "react";

const Input: FC<{
  label: string;
  type: string;
  onChange: (v: string) => void;
}> = ({ label, type, onChange }) => {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="dark:text-slate-200">{label}</span>
      <input
        onChange={(event) => {
          onChange(event.target.value);
        }}
        type={type}
        className="border outline-none py-1 px-2 rounded dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
      />
    </label>
  );
};

export default Input;
