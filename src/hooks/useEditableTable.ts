import { useState } from "react";
import { Row } from "../components/BasicTableComponents";

const useEditableTable = (initialRows: Row[]) => {
  const [rows, setRows] = useState<Row[]>(initialRows);

  const addRow = () => {
    setRows([...rows, { field1: "", field2: "" }]);
  };

  const updateRow = (index: number, field: keyof Row, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const saveRow = (index: number) => {
    const row = rows[index];
    console.log("Datos guardados:", row);
    // TODO: manejar datos guardados, enviarlos a un servidor
  };

  const saveAllRows = (onSaveData: (data: string) => void) => {
    console.log(rows);
    onSaveData(JSON.stringify(rows));
  };

  const setPrevious = (initialRows: Row[]) => {
    setRows(initialRows);
  };

  return {
    rows,
    addRow,
    updateRow,
    saveRow,
    saveAllRows,
    setPrevious
  };
};

export default useEditableTable;
