import { CloudWorkspaceEntry } from "@/accounting/core/types/accountingTypes";
import { MONTH_CODES } from "@/accounting/core/utils/constants";
import {Button} from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import pdfMake from "pdfmake";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { FC } from "react";
import { activeRows, getRows, parseAmount, formatMoney } from "../accountingMath";
import * as XLSX from "xlsx";

export type StatementRow = {
  id: string;
  month: string;
  day: string;
  income: number;
  expense: number;
  detail: string;
  account: string;
};

const EstadoResultadoView: FC<{ workspace: CloudWorkspaceEntry }> = ({
  workspace,
}) => {
  const notasPorId = Object.fromEntries(
    workspace.accounting.ingresoGastoNotas.map((nota) => [
      nota.ingresoGastoId,
      nota.nota,
    ]),
  );
  const cuentaIdPorId = Object.fromEntries(
    workspace.accounting.ingresoGastoCuentas.map((cuentaRelacion) => [
      cuentaRelacion.ingresoGastoId,
      cuentaRelacion.cuentaId,
    ]),
  );
  const cuentasPorId = Object.fromEntries(
    workspace.accounting.cuentasContables.map((cuentaContable) => [
      cuentaContable.id,
      cuentaContable.nombre,
    ]),
  );

  const statementRows: StatementRow[] = MONTH_CODES.flatMap((month) => {
    const ingresos = activeRows(
      getRows(workspace.registro, "ingresos", month),
    ).map((row) => {
      return {
        id: `${month}-ingreso-${row.id}`,
        month,
        day: row.dia || "--",
        income: parseAmount(row.importe),
        expense: 0,
        detail: notasPorId[row.id] ?? "-",
        account: cuentasPorId[cuentaIdPorId[row.id]] ?? "-",
      };
    });
    const gastos = activeRows(getRows(workspace.registro, "gastos", month)).map(
      (row) => {
        return {
          id: `${month}-gasto-${row.id}`,
          month,
          day: row.dia || "--",
          income: 0,
          expense: parseAmount(row.importe),
          detail: notasPorId[row.id] ?? "-",
          account: cuentasPorId[cuentaIdPorId[row.id]] ?? "-",
        };
      },
    );
    return [...ingresos, ...gastos];
  }).sort(
    (a, b) => a.month.localeCompare(b.month) || a.day.localeCompare(b.day),
  );
  const totalIngresos = statementRows.reduce(
    (total, row) => total + row.income,
    0,
  );
  const totalGastos = statementRows.reduce(
    (total, row) => total + row.expense,
    0,
  );
  const resultado = totalIngresos - totalGastos;
  const resultadoLabel = resultado >= 0 ? "POSITIVO" : "NEGATIVO";

  const handleDownloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    const rows: Array<{
      Mes: string;
      Dia: string;
      Ingreso: number | "";
      Gasto: number | "";
      Detalle: string;
      "Cuenta afectada": string;
    }> = statementRows.map((row) => ({
      Mes: row.month,
      Dia: row.day,
      Ingreso: row.income,
      Gasto: row.expense,
      Detalle: row.detail,
      "Cuenta afectada": row.account,
    }));
    rows.push(
      {
        Mes: "",
        Dia: "",
        Ingreso: "",
        Gasto: "",
        Detalle: "",
        "Cuenta afectada": "",
      },
      {
        Mes: "TOTAL INGRESOS",
        Dia: "",
        Ingreso: totalIngresos,
        Gasto: "",
        Detalle: "",
        "Cuenta afectada": "",
      },
      {
        Mes: "TOTAL GASTOS",
        Dia: "",
        Ingreso: "",
        Gasto: totalGastos,
        Detalle: "",
        "Cuenta afectada": "",
      },
      {
        Mes: `RESULTADO ${resultadoLabel}`,
        Dia: "",
        Ingreso: resultado,
        Gasto: "",
        Detalle: "",
        "Cuenta afectada": "",
      },
    );
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "EstadoResultado");
    const fileName = `libro-ingresos-gastos-${workspace.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDownloadPdf = () => {
    const body = [
      ["Mes", "Día", "Ingreso", "Gasto", "Detalle", "Cuenta afectada"],
      ...statementRows.map((row) => [
        row.month,
        row.day,
        row.income > 0 ? formatMoney(row.income) : "-",
        row.expense > 0 ? formatMoney(row.expense) : "-",
        row.detail,
        row.account,
      ]),
    ];
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: "Libro de ingresos y gastos", style: "title" },
        { text: workspace.name, margin: [0, 0, 0, 8] },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "auto", "auto", "*", "*"],
            body,
          },
          layout: "lightHorizontalLines",
        },
        {
          text: `Resultado final: ${formatMoney(resultado)} (${resultadoLabel})`,
          bold: true,
          color: resultado >= 0 ? "#047857" : "#be123c",
          margin: [0, 8, 0, 0],
        },
      ],
      styles: {
        title: { fontSize: 14, bold: true },
      },
      defaultStyle: { fontSize: 9 },
    };
    pdfMake
      .createPdf(docDefinition)
      .download(
        `libro-ingresos-gastos-${workspace.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
  };

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
          <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
            Descargar Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            Descargar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
            <p className="text-slate-500 dark:text-slate-300">Ingresos</p>
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
              {formatMoney(totalIngresos)}
            </p>
          </div>
          <div className="rounded-md bg-rose-50 p-3 text-sm dark:bg-rose-500/10">
            <p className="text-slate-500 dark:text-slate-300">Gastos</p>
            <p className="font-semibold text-rose-700 dark:text-rose-300">
              {formatMoney(totalGastos)}
            </p>
          </div>
          <div className="rounded-md bg-slate-100 p-3 text-sm dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-300">Resultado</p>
            <p
              className={cn(
                "font-semibold",
                resultado >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300",
              )}
            >
              {formatMoney(resultado)} ({resultadoLabel})
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-235 text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 pr-4">Mes</th>
                <th className="py-3 pr-4">Día</th>
                <th className="py-3 pr-4 text-right">Ingreso</th>
                <th className="py-3 pr-4 text-right">Gasto</th>
                <th className="py-3 pr-4">Detalle</th>
                <th className="py-3 pr-4">Cuenta afectada</th>
              </tr>
            </thead>
            <tbody>
              {statementRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 dark:border-slate-800/80"
                >
                  <td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50">
                    {row.month}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {row.day}
                  </td>
                  <td className="py-3 pr-4 text-right text-emerald-700 dark:text-emerald-300">
                    {row.income > 0 ? formatMoney(row.income) : "-"}
                  </td>
                  <td className="py-3 pr-4 text-right text-rose-700 dark:text-rose-300">
                    {row.expense > 0 ? formatMoney(row.expense) : "-"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {row.detail}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {row.account}
                  </td>
                </tr>
              ))}
              {statementRows.length === 0 && (
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

export default EstadoResultadoView