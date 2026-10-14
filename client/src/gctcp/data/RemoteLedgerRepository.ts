import api from "@/lib/api";
import type {
	CloudLedgerContainer,
	InventarioRegistro,
} from "../../accounting/core/types/accountingTypes";
import type { LedgerApiResponse } from "../types";
import type { LedgerRepository } from "./LedgerRepository";

export class RemoteLedgerRepository implements LedgerRepository {
	async loadLedger(): Promise<LedgerApiResponse> {
		const { data } = await api.get<LedgerApiResponse>("/api/cont-ledger");
		return data;
	}

	async saveLedger(
		registro: CloudLedgerContainer,
		inventarioRegistro: InventarioRegistro | null,
	): Promise<void> {
		await api.put("/api/cont-ledger", {
			registro,
			inventarioRegistro: inventarioRegistro ?? null,
		});
	}
}
