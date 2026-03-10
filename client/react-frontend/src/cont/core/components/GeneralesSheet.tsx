import type { FC } from "react";
import { Input } from "@/components/ui/input";
import type { GeneralData } from "../types";

type Props = {
  data: GeneralData;
  onChange: (field: keyof GeneralData, value: string) => void;
};

const Field: FC<{ value: string; onChange: (v: string) => void; className?: string }> = ({
  value, onChange, className = "",
}) => (
  <Input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`h-8 border-0 rounded-none ${className}`}
  />
);

export const GeneralesSheet: FC<Props> = ({ data, onChange }) => (
  <table className="w-full min-w-[560px] border-collapse text-xs md:text-sm">
    <tbody>
      <tr>
        <td rowSpan={2} className="border p-2" />
        <td colSpan={5} rowSpan={2} className="border p-2 text-center font-bold">
          REGISTRO DE INGRESOS Y GASTOS PARA EL TRABAJO POR CUENTA PROPIA
        </td>
        <td colSpan={2} className="border p-2 text-center">Año</td>
      </tr>
      <tr>
        <td colSpan={2} className="border p-0">
          <Field value={data.anio} onChange={(v) => onChange("anio", v)} className="text-center" />
        </td>
      </tr>
      <tr>
        <td colSpan={6} className="border p-2">Nombre(s) y Apellidos del Contribuyente</td>
        <td colSpan={2} className="border p-2">NIT</td>
      </tr>
      <tr>
        <td colSpan={6} className="border p-0">
          <Field value={data.nombre} onChange={(v) => onChange("nombre", v)} />
        </td>
        <td colSpan={2} className="border p-0">
          <Field value={data.nit} onChange={(v) => onChange("nit", v)} />
        </td>
      </tr>
      <tr>
        <td colSpan={8} className="border p-2">
          Domicilio fiscal: (lugar donde desarrolla la actividad): calle, No, apto, entre calles:
        </td>
      </tr>
      <tr>
        <td colSpan={8} className="border p-0">
          <Field value={data.fiscalCalle} onChange={(v) => onChange("fiscalCalle", v)} />
        </td>
      </tr>
      <tr>
        <td colSpan={2} className="border p-2">Municipio:</td>
        <td colSpan={2} className="border p-0">
          <Field value={data.fiscalMunicipio} onChange={(v) => onChange("fiscalMunicipio", v)} />
        </td>
        <td colSpan={2} className="border p-2">Provincia:</td>
        <td colSpan={2} className="border p-0">
          <Field value={data.fiscalProvincia} onChange={(v) => onChange("fiscalProvincia", v)} />
        </td>
      </tr>
      <tr>
        <td colSpan={8} className="border p-2">
          Domicilio legal: (según Carnet de Identidad): calle, No, Apto, entre calles.
        </td>
      </tr>
      <tr>
        <td colSpan={8} className="border p-0">
          <Field value={data.legalCalle} onChange={(v) => onChange("legalCalle", v)} />
        </td>
      </tr>
      <tr>
        <td colSpan={2} className="border p-2">Municipio:</td>
        <td colSpan={2} className="border p-0">
          <Field value={data.legalMunicipio} onChange={(v) => onChange("legalMunicipio", v)} />
        </td>
        <td colSpan={2} className="border p-2">Provincia:</td>
        <td colSpan={2} className="border p-0">
          <Field value={data.legalProvincia} onChange={(v) => onChange("legalProvincia", v)} />
        </td>
      </tr>
      <tr>
        <td className="border p-2">Actividad:</td>
        <td colSpan={5} className="border p-0">
          <Field value={data.actividad} onChange={(v) => onChange("actividad", v)} />
        </td>
        <td className="border p-2">Código:</td>
        <td className="border p-0">
          <Field value={data.codigo} onChange={(v) => onChange("codigo", v)} />
        </td>
      </tr>

      {/* Fila de labels D / M / A — "Firma" abarca esta fila y la siguiente */}
      <tr>
        <td colSpan={2} className="border p-2 text-center font-semibold">D</td>
        <td colSpan={2} className="border p-2 text-center font-semibold">M</td>
        <td colSpan={2} className="border p-2 text-center font-semibold">A</td>
        <td colSpan={2} rowSpan={2} className="border p-2 text-center font-semibold align-middle">
          Firma del contribuyente
        </td>
      </tr>

      {/* Fila de inputs */}
      <tr>
        <td colSpan={2} className="border p-0">
          <Field value={data.firmaDia} onChange={(v) => onChange("firmaDia", v)} className="text-center" />
        </td>
        <td colSpan={2} className="border p-0">
          <Field value={data.firmaMes} onChange={(v) => onChange("firmaMes", v)} className="text-center" />
        </td>
        <td colSpan={2} className="border p-0">
          <Field value={data.firmaAnio} onChange={(v) => onChange("firmaAnio", v)} className="text-center" />
        </td>
      </tr>
    </tbody>
  </table>
);
