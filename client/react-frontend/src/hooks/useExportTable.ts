import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type useExportTableReturnType = {
  exportToXlsx: () => void;
};

const useExportTable = (): useExportTableReturnType => {
  const exportToXlsx = () => {
    const table = document.getElementById("myTable") as HTMLTableElement;
    const workbook = XLSX.utils.table_to_book(table);
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "xlsx" });
    saveAs(data, "tabla.xlsx");
  };

  return { exportToXlsx };
};

export default useExportTable;
