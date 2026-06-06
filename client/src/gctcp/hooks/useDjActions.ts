import { useState } from "react";
import type {
  CloudLedgerContainer,
  GeneralesData,
} from "../../accounting/core/types/accountingTypes";
import type { LedgerApiResponse } from "../types";

interface UseDjActionsProps {
  ledger: CloudLedgerContainer | null;
  activeWorkspaceId: string | null;
  data: LedgerApiResponse | null;
  setData: (updater: (current: LedgerApiResponse | null) => LedgerApiResponse | null) => void;
  api: {
    put: (url: string, body: unknown) => Promise<unknown>;
  };
  toast: (options: { title: string; variant?: "destructive" }) => void;
}

export function useDjActions({
  ledger,
  activeWorkspaceId,
  data,
  setData,
  api,
  toast,
}: UseDjActionsProps) {
  const [saving, setSaving] = useState(false);

  const activeWorkspace = ledger?.workspaces.find(
    (w) => w.id === activeWorkspaceId,
  ) ?? null;

  const persistLedger = async (
    updatedLedger: CloudLedgerContainer,
    errorMessage: string,
    successMessage?: string,
  ) => {
    setSaving(true);
    try {
      await api.put("/api/cont-ledger", {
        registro: updatedLedger,
        inventarioRegistro: data?.inventarioRegistro ?? null,
      });
      setData((current) =>
        current ? { ...current, registro: updatedLedger } : current,
      );
      if (successMessage) {
        toast({ title: successMessage });
      }
    } catch {
      toast({ title: errorMessage, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGenerals = async (general: GeneralesData) => {
    if (!ledger || !activeWorkspace) return;

    const updatedLedger: CloudLedgerContainer = {
      ...ledger,
      workspaces: ledger.workspaces.map((w) =>
        w.id !== activeWorkspace.id
          ? w
          : {
              ...w,
              registro: {
                ...w.registro,
                generales: general,
              },
            },
      ),
    };

    await persistLedger(
      updatedLedger,
      "No se pudieron guardar los datos generales",
      "Datos generales guardados",
    );
  };

  return {
    saving,
    handleUpdateGenerals,
  };
}

export default useDjActions;
