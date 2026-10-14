import type { LedgerRepository } from "./LedgerRepository";
import { WebLedgerRepository } from "./WebLedgerRepository";

let cachedRepository: LedgerRepository | null = null;

export function getLedgerRepository(): LedgerRepository {
	if (!cachedRepository) {
		cachedRepository = new WebLedgerRepository();
	}
	return cachedRepository;
}
