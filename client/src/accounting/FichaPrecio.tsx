import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FC } from "react";

const DATA = [
  {
    cuenta: "CONCEPTOS",
    fila: "FILA",
    costo_base: "Costo Base",
    costo_nuevo: "Costo Nuevo",
  },
  { cuenta: "Gasto Material", fila: "1", costo_base: "0.00", costo_nuevo: "" },
  {
    cuenta: "De ello: Insumos (Materias primas y materiales) ",
    fila: "1.1",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "Combustibles y lubricantes",
    fila: "1.2",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  { cuenta: "Energía", fila: "1.3", costo_base: "0.00", costo_nuevo: "" },
  { cuenta: "Agua", fila: "1.4", costo_base: "0.00", costo_nuevo: "" },
  {
    cuenta: "Salario Directo o retribución directa",
    fila: "2",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "Otros Gastos Directos (Desglosar)",
    fila: "3",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "Gastos asociados a la producción",
    fila: "4",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "De ello, salarios",
    fila: "4.1",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "COSTO TOTAL ( 1+2+3+4)",
    fila: "5",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "Gastos Generales y de Administración",
    fila: "6",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "De ello, salarios",
    fila: "6.1",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "Gastos de Distribución y Venta",
    fila: "7",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "De ello, salarios",
    fila: "7.1",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "Gastos Financieros",
    fila: "8",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "Gastos por Financiamiento entregado a la OSDE",
    fila: "9",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta:
      "Gastos Tributarios (Contribución a la Seguridad Social e Impuesto sobre la Utilización de la Fuerza de Trabajo. Otros autorizados)",
    fila: "10",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "TOTAL DE GASTOS (suma de las filas 6, 7, 8, 9 y 10)",
    fila: "11",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "TOTAL DE COSTOS Y GASTOS (5+11)",
    fila: "12",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  { cuenta: "Utilidad", fila: "13", costo_base: "0.00", costo_nuevo: "" },
  {
    cuenta: "PRECIO O TARIFA",
    fila: "14",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "PRECIO O TARIFA UNITARIO AJUSTADO",
    fila: "15",
    costo_base: "0.00",
    costo_nuevo: "",
  },
  {
    cuenta: "Datos sobre precios de referencia",
    fila: "16",
    costo_base: "0.00",
    costo_nuevo: "",
  },
];

export type RowFichaPrecio = {
  cuenta: string;
  fila: string;
  costo_base: string;
  costo_nuevo: string;
};

const FichaPrecio: FC = () => {
  const ficha: RowFichaPrecio[] = DATA;
  return (
    <Card className="rounded-lg h-full shadow-sm m-2">
      <CardHeader className="flex-row items-center justify-between gap-3 p-4">
        <div>
          <CardTitle className="text-base">Ficha de precio</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button disabled variant="outline" size="sm">
            Descargar Excel
          </Button>
          <Button disabled variant="outline" size="sm">
            Descargar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 size-full pt-0 overflow-auto">
        <Table className="w-full h-full">
          <TableHead>
            <TableRow>
              <TableHeader>
                FICHA DE COSTOS Y GASTOS DE PRODUCTOS Y SERVICIOS
              </TableHeader>
              <TableHeader>PARA LA EVALUACIÓN DE PRECIOS Y TARIFAS</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {ficha.map((row) => {
              return (
                <TableRow>
                  <TableCell>{row.cuenta}</TableCell>
                  <TableCell>{row.fila}</TableCell>
                  <TableCell>{row.costo_base}</TableCell>
                  <TableCell>{row.costo_nuevo}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FichaPrecio;
