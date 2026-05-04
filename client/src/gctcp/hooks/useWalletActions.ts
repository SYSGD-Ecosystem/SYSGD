// hooks/useWalletActions.ts

import { useState } from "react";
import type {
  CloudLedgerContainer,
  Moneda,
  MonedaTasa,
  MonedaTasaHistorial,
  WalletMovimiento,
  WalletMovimientoTipo,
  WalletReferenciaTipo,
  WalletTipo,
} from "../../accounting/core/types/accountingTypes";
import type { LedgerApiResponse } from "../types";

interface UseWalletActionsProps {
  ledger: CloudLedgerContainer | null;
  activeWorkspaceId: string | null;
  data: LedgerApiResponse | null;
  setData: (updater: (current: LedgerApiResponse | null) => LedgerApiResponse | null) => void;
  api: {
    put: (url: string, body: unknown) => Promise<unknown>;
  };
  toast: (options: { title: string; variant?: "destructive" }) => void;
}

export function useWalletActions({
  ledger,
  activeWorkspaceId,
  data,
  setData,
  api,
  toast,
}: UseWalletActionsProps) {
  const [saving, setSaving] = useState(false);

  const activeWorkspace = ledger?.workspaces.find(
    (w) => w.id === activeWorkspaceId,
  ) ?? null;

  // ─── Helper interno para persistir y actualizar estado ───────────────────────

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

  const updateWorkspace = (
  updatedAccounting: Partial<NonNullable<typeof activeWorkspace>["accounting"]>,
): CloudLedgerContainer | null => {
  if (!ledger || !activeWorkspace) return null;

  const workspace = activeWorkspace; // narrowing explícito

  return {
    ...ledger,
    workspaces: ledger.workspaces.map((w) =>
      w.id !== workspace.id
        ? w
        : {
            ...w,
            accounting: {
              ...w.accounting,
              ...updatedAccounting,
            },
          },
    ),
  };
};

  // ─── Wallets ─────────────────────────────────────────────────────────────────

  const handleCreateWallet = async (payload: {
    nombre: string;
    tipo: WalletTipo;
    saldoInicial: number;
    monedaId: string;
  }) => {
    if (!ledger || !activeWorkspace) return;

    const now = Date.now();
    const newWallet = {
      id: `wallet-${now}`,
      nombre: payload.nombre,
      tipo: payload.tipo,
      saldoInicial: payload.saldoInicial,
      monedaId: payload.monedaId,
      activo: true,
      createdAt: now,
      updatedAt: now,
    };

    const updatedLedger = updateWorkspace({
      wallets: [...(activeWorkspace.accounting.wallets ?? []), newWallet],
    });
    if (!updatedLedger) return;

    await persistLedger(updatedLedger, "No se pudo crear la billetera", "Billetera creada");
  };

  // ─── Monedas ─────────────────────────────────────────────────────────────────

  const handleCreateMoneda = async (payload: {
    nombre: string;
    tipo: string;
    tasaInicial: number;
  }) => {
    if (!ledger || !activeWorkspace) return;

    const now = Date.now();

    const newMonedaTasa: MonedaTasa = {
      id: `tasa-${now}`,
      nombre: payload.nombre,
      tasa: payload.tasaInicial,
      createdAt: now,
      updatedAt: now,
    };

    const newMonedaTasaHistorial: MonedaTasaHistorial = {
      id: `tasaHistorial-${newMonedaTasa.id}-${now}`,
      monedaId: `moneda-${now}`,
      tasa: payload.tasaInicial,
      createdAt: now,
    };

    const newMoneda: Moneda = {
      id: `moneda-${now}`,
      nombre: payload.nombre,
      tipo: payload.tipo,
      tasaId: newMonedaTasa.id,
      createdAt: now,
      updatedAt: now,
    };

    const updatedLedger = updateWorkspace({
      monedaTasas: [
        ...(activeWorkspace.accounting.monedaTasas ?? []),
        newMonedaTasa,
      ],
      monedaTasaHistorial: [
        ...(activeWorkspace.accounting.monedaTasaHistorial ?? []),
        newMonedaTasaHistorial,
      ],
      monedas: [
        ...(activeWorkspace.accounting.monedas ?? []),
        newMoneda,
      ],
    });
    if (!updatedLedger) return;

    await persistLedger(updatedLedger, "No se pudo crear la moneda", "Moneda creada");
  };

  const handleUpdateMonedaTasa = async (monedaId: string, newTasa: number) => {
    if (!ledger || !activeWorkspace) return;

    const now = Date.now();

    const newMonedaTasaHistorial: MonedaTasaHistorial = {
      id: `tasaHistorial-${monedaId}-${now}`,
      monedaId,
      tasa: newTasa,
      createdAt: now,
    };

    const updatedLedger = updateWorkspace({
      monedaTasas: (activeWorkspace.accounting.monedaTasas ?? []).map((t) =>
        t.id !== monedaId ? t : { ...t, tasa: newTasa, updatedAt: now },
      ),
      monedaTasaHistorial: [
        ...(activeWorkspace.accounting.monedaTasaHistorial ?? []),
        newMonedaTasaHistorial,
      ],
    });
    if (!updatedLedger) return;

    await persistLedger(updatedLedger, "No se pudo actualizar la tasa", "Tasa actualizada");
  };

  // ─── Movimientos ─────────────────────────────────────────────────────────────

  const handleCreateMovimiento = async (payload: {
    tipo: WalletMovimientoTipo;
    walletOrigenId: string | null;
    walletDestinoId: string | null;
    monto: number;
    monedaId: string;
    tasaAlMomento: number;
    referenciaTipo: WalletReferenciaTipo | null;
    nota: string;
    fecha: string;
  }) => {
    if (!ledger || !activeWorkspace) return;

    const now = Date.now();
    const newMovimiento: WalletMovimiento = {
      id: `movimiento-${now}`,
      walletOrigenId: payload.walletOrigenId,
      walletDestinoId: payload.walletDestinoId,
      monto: payload.monto,
      tasaAlMomento: payload.tasaAlMomento,
      monedaId: payload.monedaId,
      tipo: payload.tipo,
      referenciaId: null,
      referenciaTipo: payload.referenciaTipo,
      nota: payload.nota,
      fecha: payload.fecha,
      createdAt: now,
    };

    const updatedLedger = updateWorkspace({
      walletMovimientos: [
        ...(activeWorkspace.accounting.walletMovimientos ?? []),
        newMovimiento,
      ],
    });
    if (!updatedLedger) return;

    await persistLedger(updatedLedger, "No se pudo crear el movimiento", "Movimiento registrado");
  };

  return {
    saving,
    handleCreateWallet,
    handleCreateMoneda,
    handleUpdateMonedaTasa,
    handleCreateMovimiento,
  };
}