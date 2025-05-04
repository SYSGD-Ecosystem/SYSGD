import { FC } from "react";

const Checkbox: FC<{label:string}> = ({label}) => {
  return (
    <div className="flex items-center gap-1">
      <input
        id={label}
        type="checkbox"
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
      />
      <label htmlFor={label} className="text-slate-800 dark:text-slate-200">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
