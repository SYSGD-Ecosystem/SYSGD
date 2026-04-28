import { FC, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import type {
  ContLedgerResponse,
  CloudWorkspaceEntry,
  GeneralesData,
} from "../types/accountingTypes";

const EMPTY_GENERALES: GeneralesData = {
  nombre: "",
  anio: new Date().getFullYear(),
  nit: "",
  actividad: "",
  codigo: "",
  fiscalCalle: "",
  fiscalMunicipio: "",
  fiscalProvincia: "",
  legalCalle: "",
  legalMunicipio: "",
  legalProvincia: "",
};

const GC_TCP: FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContLedgerResponse | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<CloudWorkspaceEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: response } = await api.get<ContLedgerResponse>("/api/cont-ledger");
        setData(response);
        const ledger = response.registro;
        const active = ledger.workspaces.find(
          (w) => w.id === ledger.activeWorkspaceId
        ) ?? ledger.workspaces[0] ?? null;
        setActiveWorkspace(active);
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar el registro contable",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [toast]);

  const handleSwitchWorkspace = async (workspaceId: string) => {
    if (!data) return;
    try {
      await api.put("/api/cont-ledger/active-workspace", {
        activeWorkspaceId: workspaceId,
      });
      const ledger = data.registro;
      const updatedLedger = { ...ledger, activeWorkspaceId: workspaceId };
      setData({ ...data, registro: updatedLedger });
      const active = updatedLedger.workspaces.find((w) => w.id === workspaceId) ?? null;
      setActiveWorkspace(active);
      toast({ title: "Éxito", description: "Espacio de trabajo cambiado" });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cambiar el espacio de trabajo",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        No hay datos disponibles
      </div>
    );
  }

  const ledger = data.registro;
  const generales = activeWorkspace?.registro.generales ?? EMPTY_GENERALES;

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            GC TCP
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestión de Contabilidad TCP - Espacios de trabajo
          </p>
        </div>

        {/* Workspace Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Espacios de trabajo
            </h2>
            <span className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
              {ledger.workspaces.length} configurado{ledger.workspaces.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2">
            {ledger.workspaces.map((ws) => (
              <div
                key={ws.id}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  ws.id === ledger.activeWorkspaceId
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
                onClick={() => handleSwitchWorkspace(ws.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSwitchWorkspace(ws.id);
                  }
                }}
                tabIndex={0}
                role="button"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ws.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {ws.id}
                    </p>
                  </div>
                  {ws.id === ledger.activeWorkspaceId && (
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                      Activo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Workspace General Data */}
        {activeWorkspace && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Datos generales - {activeWorkspace.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nombre</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {generales.nombre || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Año</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {generales.anio || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">NIT</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {generales.nit || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Actividad</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {generales.actividad || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Código</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {generales.codigo || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dirección Fiscal</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {generales.fiscalCalle
                    ? `${generales.fiscalCalle}, ${generales.fiscalMunicipio}, ${generales.fiscalProvincia}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dirección Legal</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {generales.legalCalle
                    ? `${generales.legalCalle}, ${generales.legalMunicipio}, ${generales.legalProvincia}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GC_TCP;
