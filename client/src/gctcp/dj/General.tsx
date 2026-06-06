import { CloudWorkspaceEntry, GeneralesData } from "@/accounting/core/types/accountingTypes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Edit2, WalletCards } from "lucide-react";
import { useEffect, useState, type FC } from "react";
import { EMPTY_GENERALES } from "../accountingMath";
import { MetricCard } from "../components";
import { WorkspaceAnalysis } from "../types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { municipiosByProvincia, provinces } from "./util";

const DjGeneral: FC<{
  workspace: CloudWorkspaceEntry;
  analysis: WorkspaceAnalysis;
  saving?: boolean;
  onSave?: (general: GeneralesData) => void;
}> = ({ workspace, analysis, saving = false, onSave }) => {
  const generales = workspace.registro.generales ?? EMPTY_GENERALES;

  const [showEditDialog, setShowEditDialog] = useState(false);

  const [nombre, setNombre] = useState(generales.nombre);
  const [nit, setNit] = useState(generales.nit);

  const [legalProvincia, setLegalProvincia] = useState(
    generales.legalProvincia,
  );
  const [legalMunicipio, setLegalMunicipio] = useState(
    generales.legalMunicipio,
  );
  const [legalCalle, setLegalCalle] = useState(generales.legalCalle);

  const [fiscalProvincia, setFiscalProvincia] = useState(
    generales.fiscalProvincia,
  );
  const [fiscalMunicipio, setFiscalMunicipio] = useState(
    generales.fiscalMunicipio,
  );
  const [fiscalCalle, setFiscalCalle] = useState(generales.fiscalCalle);

  const [actividad, setActividad] = useState(generales.actividad);
  const [codigo, setCodigo] = useState(generales.codigo);

  useEffect(() => {
    setNombre(generales.nombre);
    setNit(generales.nit);
    setLegalProvincia(generales.legalProvincia);
    setLegalMunicipio(generales.legalMunicipio);
    setLegalCalle(generales.legalCalle);
    setFiscalProvincia(generales.fiscalProvincia);
    setFiscalMunicipio(generales.fiscalMunicipio);
    setFiscalCalle(generales.fiscalCalle);
    setActividad(generales.actividad);
    setCodigo(generales.codigo);
  }, [generales]);

  const fiscalAddress = [
    generales.fiscalCalle,
    generales.fiscalMunicipio,
    generales.fiscalProvincia,
  ]
    .filter(Boolean)
    .join(", ");
  const legalAddress = [
    generales.legalCalle,
    generales.legalMunicipio,
    generales.legalProvincia,
  ]
    .filter(Boolean)
    .join(", ");
  const fields = [
    ["Nombre", generales.nombre],
    ["Año", String(generales.anio || "")],
    ["NIT", generales.nit],
    ["Actividad", generales.actividad],
    ["Codigo", generales.codigo],
    ["Direccion fiscal", fiscalAddress],
    ["Direccion legal", legalAddress],
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="p-4 flex flex-row">
          <CardTitle className="text-base w-full">Datos generales</CardTitle>
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowEditDialog(true)}>
                <Edit2 /> Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Datos generales</DialogTitle>
                <DialogDescription>
                  Datos para el llenado general del informe de ingresos y gastos
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    placeholder="Nombre y apellidos"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-full">
                    <Label htmlFor="nit">NIT</Label>
                    <Input
                      id="nit"
                      placeholder="NIT"
                      value={nit}
                      onChange={(e) => setNit(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div>
                    <Label htmlFor="anio">Año</Label>
                    <Input
                      id="anio"
                      placeholder="Año"
                      value={generales.anio}
                      disabled
                      readOnly
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Se actualiza desde el selector de año fiscal.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fiscalCalle">Domicilio fiscal:</Label>
                  <Input
                    id="fiscalCalle"
                    type="text"
                    step="0.01"
                    placeholder="Domicilio"
                    value={fiscalCalle}
                    onChange={(e) => setFiscalCalle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lugar donde desarrolla la actividad: calle, No, apto, entre
                    calles
                  </p>
                </div>

                <div className="grid gap-2">
                  <div className="flex gap-2">
                    <div className="w-full">
                      <Label htmlFor="moneda-tipo">Municipio</Label>
                      <Select
                        value={fiscalMunicipio}
                        onValueChange={setFiscalMunicipio}
                        disabled={fiscalProvincia===""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar municipio" />
                        </SelectTrigger>
                        <SelectContent>
                          {municipiosByProvincia[
                            fiscalProvincia === ""
                              ? "La Habana"
                              : fiscalProvincia
                          ].map((municipio) => {
                            return (
                              <SelectItem key={municipio} value={municipio}>
                                {municipio}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full">
                      <Label htmlFor="moneda-tipo">Provincia</Label>
                      <Select
                        value={fiscalProvincia}
                        onValueChange={setFiscalProvincia}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar provincia" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((province) => {
                            return (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="legalCalle">Domicilio legal:</Label>
                  <Input
                    id="legalCalle"
                    type="text"
                    step="0.01"
                    placeholder="Domicilio"
                    value={legalCalle}
                    onChange={(e) => setLegalCalle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Domicilio legal según Carnet de Identidad: calle, No, Apto,
                    entre calles.
                  </p>
                </div>

                <div className="grid gap-2">
                  <div className="flex gap-2">
                    <div className="w-full">
                      <Label htmlFor="moneda-tipo">Municipio</Label>
                      <Select
                        value={legalMunicipio}
                        onValueChange={setLegalMunicipio}
                        disabled={legalProvincia===""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar municipio" />
                        </SelectTrigger>
                        <SelectContent>
                          {municipiosByProvincia[
                            legalProvincia === "" ? "La Habana" : legalProvincia
                          ].map((municipio) => {
                            return (
                              <SelectItem key={municipio} value={municipio}>
                                {municipio}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full">
                      <Label htmlFor="moneda-tipo">Provincia</Label>
                      <Select
                        value={legalProvincia}
                        onValueChange={setLegalProvincia}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar provincia" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((province) => {
                            return (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-full">
                    <Label htmlFor="actividad">Actividad</Label>
                    <Input
                      id="actividad"
                      placeholder="Actividad desarrolada"
                      value={actividad}
                      onChange={(e) => setActividad(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      placeholder="Código"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setShowEditDialog(false)}>Cancelar</Button>
                <Button
                  disabled={saving}
                  onClick={() => {
                    onSave?.({
                      nombre,
                      anio: generales.anio,
                      nit,
                      actividad,
                      codigo,
                      fiscalCalle,
                      fiscalMunicipio,
                      fiscalProvincia,
                      legalCalle,
                      legalMunicipio,
                      legalProvincia,
                    });
                    setShowEditDialog(false);
                  }}
                >{saving ? "Gardando..." : "Guardar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </CardHeader>
        <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                {label}
              </p>
              <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-950 dark:text-slate-50">
                {value || "-"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Lectura del espacio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <MetricCard
            title="Completitud fiscal"
            value={`${analysis.completenessScore}%`}
            detail="Campos base completados"
            icon={<WalletCards />}
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400">
                Ultimo mes activo
              </p>
              <p className="font-semibold text-slate-950 dark:text-slate-50">
                {analysis.lastMonthWithActivity}
              </p>
            </div>
            <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400">Cuentas</p>
              <p className="font-semibold text-slate-950 dark:text-slate-50">
                {analysis.accountCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DjGeneral;
