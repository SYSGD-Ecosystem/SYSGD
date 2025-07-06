import { type FC, useEffect } from "react";
import Table, { Td } from "./BasicTableComponents";
import useEditableTable from "../hooks/useEditableTable";
import useConnection from "../hooks/connection/useConnection";
import { useToast } from "../hooks/use-toast";
import useGetTopographicRegister from "../hooks/connection/useGetTopographicRegister";
import type { TopographicRegisterData } from "../types/TopographicRegister";
import { Button } from "./ui/button";
import { Plus, SaveAll } from "lucide-react";

export type TopographicRegisterProps = {
  archiveId: string;
  company: string;
  managementFile: string;
};

const TopographicRegister: FC<TopographicRegisterProps> = ({
  archiveId,
  company,
  managementFile,
}) => {
  const { rows, addRow, updateRow, saveAllRows, setPrevious } =
    useEditableTable<TopographicRegisterData>([
      {
        codigo_oficina: "",
        serie_documental: "",
        fecha_mas_antigua: "",
        fecha_mas_reciente: "",
        deposito: "",
        gaveta: "",
        soporte_digital_pc_carpeta: "",
        tipo_ordenamiento: "",
      },
    ]);

  const { handleNewTopographicRegister } = useConnection();
  const { topographic } = useGetTopographicRegister(archiveId);
  const { toast } = useToast();

  const handleSaveData = (data: string) => {
    if (!data) return;
    handleNewTopographicRegister(
      data,
      archiveId,
      () => toast({ title: "Guardado" }),
      () =>
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar",
        }),
    );
  };

  // cargamos datos previos
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
    if (topographic && topographic.length > 0) {
      setPrevious(topographic);
    }
  }, [topographic, archiveId]);

  return (
    <div className="size-full flex flex-col overflow-auto">
      <div className="w-full flex justify-center p-2 items-center">
        <div className="bg-white dark:bg-slate-900 py-5 px-10 border dark:border-slate-700 flex flex-col shadow w-full max-w-[21.59cm] min-w-[21.59cm] min-h-[27.54cm] rounded">
          <div id="content">
            <Table>
              <thead>
                <tr>
                  <th colSpan={11} className="py-2">
                    <div className="flex">
                      <div className="w-full">ANEXO</div>
                      <div className="w-full text-right"> A6</div>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th colSpan={11} className="text-center py-2 text-base uppercase">
                    REGISTRO TOPOGRÁFICO DE ARCHIVOS DE OFICINA
                  </th>
                </tr>
                <tr>
                  <th colSpan={11} className="text-left py-2 text-sm uppercase">
                    <div>
                      Entidad: <span className="font-normal">{company}</span>
                    </div>
                    <div>
                      Oficina Productora: <span className="font-normal">{managementFile}</span>
                    </div>
                  </th>
                </tr>
                <tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
                  <th rowSpan={2} className="p-2 border dark:border-gray-700 min-w-20 text-center">
                    Código Oficina
                  </th>
                  <th rowSpan={2} className="p-2 border dark:border-gray-700 min-w-36">
                    Serie Documental
                  </th>
                  <th colSpan={2} className="p-2 border dark:border-gray-700 min-w-32 text-center">
                    Fechas Extremas
                  </th>
                  <th colSpan={3} className="p-2 border dark:border-gray-700 text-center">
                    Datos de Localización Física
                  </th>
                  <th rowSpan={2} className="p-2 border dark:border-gray-700 text-center">
                    Tipo de Ordenamiento
                  </th>
                </tr>
                <tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
                  <th className="p-2 border dark:border-gray-700 text-center">Más antigua</th>
                  <th className="p-2 border dark:border-gray-700 text-center">Más reciente</th>
                  <th className="p-2 border dark:border-gray-700 text-center">Depósito</th>
                  <th className="p-2 border dark:border-gray-700 text-center">Gaveta</th>
                  <th className="p-2 border dark:border-gray-700 text-center">Soporte digital PC/Carpeta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  <tr key={index}>
                    <Td
                      label={row.codigo_oficina}
                      onBlur={(e) =>
                        updateRow(index, "codigo_oficina", e.currentTarget.innerText)
                      }
                    />
                    <Td
                      label={row.serie_documental}
                      onBlur={(e) =>
                        updateRow(index, "serie_documental", e.currentTarget.innerText)
                      }
                    />
                    <Td
                      label={row.fecha_mas_antigua}
                      onBlur={(e) =>
                        updateRow(index, "fecha_mas_antigua", e.currentTarget.innerText)
                      }
                    />
                    <Td
                      label={row.fecha_mas_reciente}
                      onBlur={(e) =>
                        updateRow(index, "fecha_mas_reciente", e.currentTarget.innerText)
                      }
                    />
                    <Td
                      label={row.deposito}
                      onBlur={(e) => updateRow(index, "deposito", e.currentTarget.innerText)}
                    />
                    <Td
                      label={row.gaveta}
                      onBlur={(e) => updateRow(index, "gaveta", e.currentTarget.innerText)}
                    />
                    <Td
                      label={row.soporte_digital_pc_carpeta}
                      onBlur={(e) =>
                        updateRow(index, "soporte_digital_pc_carpeta", e.currentTarget.innerText)
                      }
                    />
                    <Td
                      label={row.tipo_ordenamiento}
                      onBlur={(e) =>
                        updateRow(index, "tipo_ordenamiento", e.currentTarget.innerText)
                      }
                    />
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Button onClick={addRow} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Fila
              </Button>
              <Button
                onClick={() => saveAllRows(handleSaveData)}
                size="sm"
                variant="outline"
              >
                <SaveAll className="w-4 h-4 mr-1" /> Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopographicRegister;
