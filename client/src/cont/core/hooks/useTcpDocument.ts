import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import type { GeneralData, MonthEntries, TributosEntry, TcpDocumentPayload } from "../types";
import {
  createMonthEntries,
  createEmptyTributos,
} from "../utils/constants";

const EMPTY_GENERAL: GeneralData = {
  anio: "", nombre: "", nit: "",
  fiscalCalle: "", fiscalMunicipio: "", fiscalProvincia: "",
  legalCalle: "", legalMunicipio: "", legalProvincia: "",
  actividad: "", codigo: "",
  firmaDia: "", firmaMes: "", firmaAnio: "",
};

export function useTcpDocument(documentId?: string) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [generalData, setGeneralData] = useState<GeneralData>(EMPTY_GENERAL);
  const [ingresos, setIngresos] = useState<MonthEntries>(createMonthEntries());
  const [gastos, setGastos] = useState<MonthEntries>(createMonthEntries());
  const [tributos, setTributos] = useState<TributosEntry[]>(createEmptyTributos());

  useEffect(() => {
    if (!documentId) return;
    const load = async () => {
      try {
        const { data } = await api.get<{ payload?: TcpDocumentPayload }>(
          `/api/accounting-documents/${documentId}`,
        );
        if (!data.payload) return;
        setGeneralData(data.payload.generalData ?? EMPTY_GENERAL);
        setIngresos(data.payload.ingresos ?? createMonthEntries());
        setGastos(data.payload.gastos ?? createMonthEntries());
        setTributos(data.payload.tributos ?? createEmptyTributos());
      } catch {
        toast({ title: "Error", description: "No se pudo cargar el documento contable", variant: "destructive" });
      }
    };
    void load();
  }, [documentId, toast]);

  const save = async () => {
    if (!documentId) return;
    setIsSaving(true);
    try {
      await api.put(`/api/accounting-documents/${documentId}`, {
        payload: { generalData, ingresos, gastos, tributos },
      });
      toast({ title: "Guardado", description: "Documento contable guardado" });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el documento", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    generalData, setGeneralData,
    ingresos, setIngresos,
    gastos, setGastos,
    tributos, setTributos,
    isSaving, save,
    payload: { generalData, ingresos, gastos, tributos } as TcpDocumentPayload,
  };
}
