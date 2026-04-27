import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";

export interface AccountingCategoryRecord {
	code: string;
	name: string;
}

export interface AccountingSubcategoryRecord {
	code: string;
	name: string;
}

export interface AccountingItemRecord {
	itemType: string;
	categoryCode: string;
	categoryName: string;
	subcategoryCode: string;
	subcategoryName: string;
	accountCode: string;
	accountName: string;
	accountNature: string;
	subaccountCode: string;
	subaccountName: string;
	subaccountNature: string;
	displayCode: string;
	displayName: string;
	displayNature: string;
}

export interface CnaeCorrelationRecord {
	codeCnae: string;
	descriptionCnae: string;
	codeNae: string;
	descriptionNae: string;
	codeCiiu: string;
	descriptionCiiu: string;
}

export interface CnaeItemRecord {
	section: string;
	structure: string;
	code: string;
	description: string;
	notes: string[];
	correlations: CnaeCorrelationRecord[];
}

interface CnaeRow {
	section: string;
	extructure: string;
	code: string;
	description: string;
}

interface AccountingRow {
	item_type: string;
	category_code: string;
	category_name: string;
	subcategory_code: string | null;
	subcategory_name: string | null;
	account_code: string;
	account_name: string;
	account_nature: string;
	subaccount_code: string | null;
	subaccount_name: string | null;
	subaccount_nature: string | null;
	display_code: string;
	display_name: string;
	display_nature: string;
}

interface CnaeNoteRow {
	descripcion: string;
}

interface CnaeCorrelationRow {
	code_cnae: string;
	description_cnae: string;
	code_nae: string;
	description_nae: string;
	code_ciiu: string;
	description_ciiu: string;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const resolveNomenclatorDbPath = (): string => {
	const configuredPath = process.env.NOMENCLATOR_DB_PATH;
	const candidates = [
		configuredPath,
		path.resolve(process.cwd(), "assets/database.db"),
		path.resolve(process.cwd(), "assets/filesdata.db"),
		path.resolve(process.cwd(), "../accounting/android/app/src/main/assets/filesdata.db"),
		path.resolve(process.cwd(), "../accounting/android/app/src/main/assets/database.db"),
		path.resolve(__dirname, "../../../assets/database.db"),
		path.resolve(__dirname, "../../../assets/filesdata.db"),
		path.resolve(__dirname, "../../../accounting/android/app/src/main/assets/filesdata.db"),
		path.resolve(__dirname, "../../../accounting/android/app/src/main/assets/database.db"),
	].filter((candidate): candidate is string => Boolean(candidate && candidate.trim()));

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	throw new Error(
		"No se encontró la base del nomenclador. Configura NOMENCLATOR_DB_PATH o copia database.db/filesdata.db a server/assets",
	);
};

const openDatabase = async (): Promise<sqlite3.Database> => {
	const dbPath = resolveNomenclatorDbPath();
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(db);
		});
	});
};

const closeDatabase = async (db: sqlite3.Database): Promise<void> => {
	await new Promise<void>((resolve, reject) => {
		db.close((error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
};

const queryAll = async <T extends object>(
	db: sqlite3.Database,
	sql: string,
	params: unknown[] = [],
): Promise<T[]> => {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (error, rows) => {
			if (error) {
				reject(error);
				return;
			}
			resolve((rows ?? []) as T[]);
		});
	});
};

const normalizeLimit = (limit?: number): number => {
	if (!limit || Number.isNaN(limit)) {
		return DEFAULT_LIMIT;
	}

	return Math.min(Math.max(limit, 1), MAX_LIMIT);
};

export const getAccountingCategories = async (): Promise<AccountingCategoryRecord[]> => {
	const db = await openDatabase();

	try {
		const rows = await queryAll<AccountingCategoryRecord>(
			db,
			"SELECT code, name FROM account_categories ORDER BY sort_order, code",
		);
		return rows;
	} finally {
		await closeDatabase(db);
	}
};

export const getAccountingSubcategories = async (): Promise<AccountingSubcategoryRecord[]> => {
	const db = await openDatabase();

	try {
		const rows = await queryAll<AccountingSubcategoryRecord>(
			db,
			"SELECT code, name FROM account_subcategories ORDER BY sort_order, code",
		);
		return rows;
	} finally {
		await closeDatabase(db);
	}
};

export const searchAccountingCatalog = async (params: {
	term?: string;
	categoryCode?: string;
	subcategoryCode?: string;
	limit?: number;
}): Promise<AccountingItemRecord[]> => {
	const db = await openDatabase();
	const args: unknown[] = [];
	const where: string[] = [];
	const trimmedTerm = params.term?.trim() ?? "";
	const limit = normalizeLimit(params.limit);

	try {
		if (trimmedTerm) {
			const value = `%${trimmedTerm}%`;
			where.push(`
				(
					UPPER(display_name) LIKE UPPER(?)
					OR UPPER(display_code) LIKE UPPER(?)
					OR UPPER(category_name) LIKE UPPER(?)
					OR UPPER(subcategory_name) LIKE UPPER(?)
				)
			`);
			args.push(value, value, value, value);
		}

		if (params.categoryCode?.trim()) {
			where.push("category_code = ?");
			args.push(params.categoryCode.trim());
		}

		if (params.subcategoryCode?.trim()) {
			where.push("subcategory_code = ?");
			args.push(params.subcategoryCode.trim());
		}

		const sql = `
			SELECT
				item_type,
				category_code,
				category_name,
				COALESCE(subcategory_code, '') AS subcategory_code,
				COALESCE(subcategory_name, '') AS subcategory_name,
				account_code,
				account_name,
				account_nature,
				COALESCE(subaccount_code, '') AS subaccount_code,
				COALESCE(subaccount_name, '') AS subaccount_name,
				COALESCE(subaccount_nature, '') AS subaccount_nature,
				display_code,
				display_name,
				display_nature
			FROM (
				SELECT
					'Cuenta' AS item_type,
					category_code,
					category_name,
					subcategory_code,
					subcategory_name,
					account_code,
					account_name,
					account_nature,
					NULL AS subaccount_code,
					NULL AS subaccount_name,
					NULL AS subaccount_nature,
					account_code AS display_code,
					account_name AS display_name,
					account_nature AS display_nature
				FROM account_catalog_flat
				WHERE subaccount_id IS NULL
				UNION ALL
				SELECT
					'Subcuenta' AS item_type,
					category_code,
					category_name,
					subcategory_code,
					subcategory_name,
					account_code,
					account_name,
					account_nature,
					subaccount_code,
					subaccount_name,
					subaccount_nature,
					account_code || '.' || subaccount_code AS display_code,
					subaccount_name AS display_name,
					subaccount_nature AS display_nature
				FROM account_catalog_flat
				WHERE subaccount_id IS NOT NULL
			) catalog
			${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
			ORDER BY category_code, subcategory_code, account_code, subaccount_code
			LIMIT ?
		`;

		args.push(limit);

		const rows = await queryAll<AccountingRow>(db, sql, args);
		return rows.map((row) => ({
			itemType: row.item_type,
			categoryCode: row.category_code,
			categoryName: row.category_name,
			subcategoryCode: row.subcategory_code ?? "",
			subcategoryName: row.subcategory_name ?? "",
			accountCode: row.account_code,
			accountName: row.account_name,
			accountNature: row.account_nature,
			subaccountCode: row.subaccount_code ?? "",
			subaccountName: row.subaccount_name ?? "",
			subaccountNature: row.subaccount_nature ?? "",
			displayCode: row.display_code,
			displayName: row.display_name,
			displayNature: row.display_nature,
		}));
	} finally {
		await closeDatabase(db);
	}
};

const getCnaeNotes = async (
	db: sqlite3.Database,
	code: string,
): Promise<string[]> => {
	const rows = await queryAll<CnaeNoteRow>(
		db,
		"SELECT descripcion FROM cnae_notes WHERE codigo_notas = ?",
		[code],
	);
	return rows.map((row) => row.descripcion);
};

const getCnaeCorrelations = async (
	db: sqlite3.Database,
	code: string,
): Promise<CnaeCorrelationRecord[]> => {
	const rows = await queryAll<CnaeCorrelationRow>(
		db,
		`
			SELECT code_cnae, description_cnae, code_nae, description_nae, code_ciiu, description_ciiu
			FROM cnae_correlation
			WHERE code_cnae = ?
		`,
		[code],
	);

	return rows.map((row) => ({
		codeCnae: row.code_cnae,
		descriptionCnae: row.description_cnae,
		codeNae: row.code_nae,
		descriptionNae: row.description_nae,
		codeCiiu: row.code_ciiu,
		descriptionCiiu: row.description_ciiu,
	}));
};

export const searchCnaeCatalog = async (params: {
	term?: string;
	limit?: number;
}): Promise<CnaeItemRecord[]> => {
	const db = await openDatabase();
	const trimmedTerm = params.term?.trim() ?? "";
	const limit = normalizeLimit(params.limit);
	const value = `%${trimmedTerm}%`;

	try {
		const rows = await queryAll<CnaeRow>(
			db,
			`
				SELECT section, extructure, code, description
				FROM cnae
				WHERE ? = '%%'
				   OR UPPER(description) LIKE UPPER(?)
				   OR UPPER(code) LIKE UPPER(?)
				   OR UPPER(section) LIKE UPPER(?)
				   OR UPPER(extructure) LIKE UPPER(?)
				ORDER BY code
				LIMIT ?
			`,
			[value, value, value, value, value, limit],
		);

		const items = await Promise.all(
			rows.map(async (row) => ({
				section: row.section,
				structure: row.extructure,
				code: row.code,
				description: row.description,
				notes: await getCnaeNotes(db, row.code),
				correlations: await getCnaeCorrelations(db, row.code),
			})),
		);

		return items;
	} finally {
		await closeDatabase(db);
	}
};
