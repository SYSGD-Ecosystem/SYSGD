import type {
	CloudLedgerContainer,
	InventarioRegistro,
} from "../../accounting/core/types/accountingTypes";
import type { LedgerApiResponse } from "../types";

export interface LedgerRepository {
	loadLedger(): Promise<LedgerApiResponse>;
	saveLedger(
		registro: CloudLedgerContainer,
		inventarioRegistro: InventarioRegistro | null,
	): Promise<void>;
}
