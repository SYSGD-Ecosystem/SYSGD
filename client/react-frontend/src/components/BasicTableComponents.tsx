import { FC, HTMLAttributes } from "react";

export interface Row{
    field1:string
    field2:string
}

export interface TableProps extends HTMLAttributes<HTMLTableElement> {}

const Table: FC<TableProps> = ({ children }) => {
  return (
    <table
      id="myTable"
      className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400"
    >
      {children}
    </table>
  );
};

export default Table;
