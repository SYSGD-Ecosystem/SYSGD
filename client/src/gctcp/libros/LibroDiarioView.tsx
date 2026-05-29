import {
  CloudWorkspaceEntry,
  LibroDiarioListOperations,
  LibroDiarioOperation,
} from "@/accounting/core/types/accountingTypes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FC } from "react";
import DialogAddDiaryOperation from "./DialogAddDiaryOperation";

const dummyOperations: LibroDiarioListOperations[] = [
  {
    explication: "Pago de facturas",
    operations: [
      {
        id: "12345",
        operation_id: "DB001",
        type: "Parcial",
        cuenta_id: "ACCT001",
        importe: 100,
        moneda_id: "USD",
      },
      {
        id: "67890",
        operation_id: "DB001",
        type: "Debito",
        cuenta_id: "ACCT002",
        importe: 50,
        moneda_id: "USD",
      },
      {
        id: "11223",
        operation_id: "DB001",
        type: "Haber",
        cuenta_id: "ACCT003",
        importe: 200,
        moneda_id: "EUR",
      },
    ],
    fecha: "24/05/2026",
    id: "DB001",
  },
];

export type StatementRow = {
  id: string;
  fecha?: string;
  cuenta: string;
  parcial?: number | string;
  debe?: number | string;
  haber?: number | string;
  ref: string;
};

const LibroDiarioView: FC<{ workspace: CloudWorkspaceEntry }> = ({
  workspace,
}) => {
  // const getFechaById = (id: string): LibroDiarioDetails | undefined => dummyDetails.find((m) => m.operation_id === id);

  // const handleDownloadExcel = () => {
  //   const workbook = XLSX.utils.book_new();
  //   const rows: Array<{
  //     Fecha: string;
  //     Cuenta: string;
  //     Parcial: number | "";
  //     Debe: number | "";
  //     Haber: string;
  //   }> = statementRows.map((row) => ({
  //     Fecha: row.fecha,
  //     Cuenta: row.cuenta,
  //     Parcial: row.parcial,
  //     Debe: row.debe,
  //     Haber: row.haber,
  //   }));
  //   rows.push(
  //     {
  //       Mes: "",
  //       Dia: "",
  //       Ingreso: "",
  //       Gasto: "",
  //       Detalle: "",
  //       "Cuenta afectada": "",
  //     },
  //     {
  //       Mes: "TOTAL INGRESOS",
  //       Dia: "",
  //       Ingreso: totalIngresos,
  //       Gasto: "",
  //       Detalle: "",
  //       "Cuenta afectada": "",
  //     },
  //     {
  //       Mes: "TOTAL GASTOS",
  //       Dia: "",
  //       Ingreso: "",
  //       Gasto: totalGastos,
  //       Detalle: "",
  //       "Cuenta afectada": "",
  //     },
  //     {
  //       Mes: `RESULTADO ${resultadoLabel}`,
  //       Dia: "",
  //       Ingreso: resultado,
  //       Gasto: "",
  //       Detalle: "",
  //       "Cuenta afectada": "",
  //     },
  //   );
  //   const worksheet = XLSX.utils.json_to_sheet(rows);
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "EstadoResultado");
  //   const fileName = `libro-ingresos-gastos-${workspace.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  //   XLSX.writeFile(workbook, fileName);
  // };

  // const handleDownloadPdf = () => {
  //   const body = [
  //     ["Mes", "Día", "Ingreso", "Gasto", "Detalle", "Cuenta afectada"],
  //     ...statementRows.map((row) => [
  //       row.fecha,
  //       row.cuenta,
  //       row.parcial,
  //       row.debe,
  //       row.haber,
  //     ]),
  //   ];
  //   const docDefinition: TDocumentDefinitions = {
  //     content: [
  //       { text: "Libro Diario", style: "title" },
  //       { text: workspace.name, margin: [0, 0, 0, 8] },
  //       {
  //         table: {
  //           headerRows: 1,
  //           widths: ["auto", "auto", "auto", "auto", "*", "*"],
  //           body,
  //         },
  //         layout: "lightHorizontalLines",
  //       },
  //     ],
  //     styles: {
  //       title: { fontSize: 14, bold: true },
  //     },
  //     defaultStyle: { fontSize: 9 },
  //   };
  //   pdfMake
  //     .createPdf(docDefinition)
  //     .download(
  //       `libro-ingresos-gastos-${workspace.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`,
  //     );
  // };

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-3 p-4">
        <div>
          <CardTitle className="text-base">
            Libro de ingresos y gastos
          </CardTitle>
          <Badge variant="outline" className="mt-2">
            {workspace.name}
          </Badge>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
            Descargar Excel
          </Button> */}
          <DialogAddDiaryOperation workspace={workspace}/>
          <Button variant="outline" size="sm" onClick={() => {}}>
            Descargar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-235 text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 pr-4">Fecha</th>
                <th className="py-3 pr-4">Cuenta y Detalle</th>
                <th className="py-3 pr-4 text-right">Parcial</th>
                <th className="py-3 pr-4 text-right">Debe</th>
                <th className="py-3 pr-4 text-right">Haber</th>
              </tr>
            </thead>
            <tbody>
              {dummyOperations.map((op) => (
                <>
                  <ViewLines operations={op.operations} fecha={op.fecha} />
                  <tr className="border-b border-slate-100 dark:border-slate-800/80">
                    <td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50"></td>
                    <td className="py-3 pr-4 text-slate-600 font-bold dark:text-slate-300">
                      Exp: {op.explication}
                    </td>
                    <td className="py-3 pr-4 text-right text-emerald-700 dark:text-emerald-300"></td>
                    <td className="py-3 pr-4 text-right text-rose-700 dark:text-rose-300"></td>
                    <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300"></td>
                  </tr>
                </>
              ))}
              {dummyOperations.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No hay movimientos registrados para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LibroDiarioView;

const ViewLines: FC<{ operations: LibroDiarioOperation[]; fecha: string }> = ({
  operations,
  fecha,
}) => {
  const ops = operations.map((row) => {
    return (
      <tr
        key={row.id}
        className="border-b border-slate-100 dark:border-slate-800/80"
      >
        <td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50">
          {fecha}
        </td>
        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
          {row.cuenta_id}
        </td>
        <td className="py-3 pr-4 text-right text-emerald-700 dark:text-emerald-300">
          {row.type === "Parcial" ? row.importe: ""}
        </td>
        <td className="py-3 pr-4 text-right text-rose-700 dark:text-rose-300">
          {row.type === "Debito" ? row.importe: ""}
        </td>
        <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300">
          {row.type === "Haber" ? row.importe: ""}
        </td>
      </tr>
    );
  });

  return <>{ops}</>;
};
