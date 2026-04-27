import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FC } from "react";




const FichaPrecio: FC = () => {
    return <div className="p-2 w-full">
        <header><h3>Ficha de precio</h3></header>
        <Table>
            <TableHead>
                <TableRow>
                    <TableHeader>FICHA DE COSTOS Y GASTOS DE PRODUCTOS Y SERVICIOS</TableHeader>
                    <TableHeader>PARA LA EVALUACIÓN DE PRECIOS Y TARIFAS
                    </TableHeader>
                </TableRow>
            </TableHead>
            <TableBody>
                <TableRow>
                <TableCell><TableHeader>CONCEPTOS</TableHeader></TableCell>
                <TableCell>Fila</TableCell>
                <TableCell>Costo base</TableCell>
                <TableCell>Costo nuevo</TableCell>
                </TableRow>
            </TableBody>

        </Table>
    </div>
}

export default FichaPrecio