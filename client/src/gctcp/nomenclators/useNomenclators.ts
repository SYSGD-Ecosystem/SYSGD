import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import type {
	AccountingCatalogItem,
	AccountingCategory,
	AccountingSubcategory,
	CnaeCatalogItem,
	NomenclatorFilters,
	NomenclatorKind,
} from "./types";

const DEFAULT_FILTERS: NomenclatorFilters = {
	query: "",
	categoryCode: "",
	subcategoryCode: "",
};

const resultLimit = 80;

export const useNomenclators = () => {
	const [kind, setKind] = useState<NomenclatorKind>("accounting");
	const [filters, setFilters] = useState<NomenclatorFilters>(DEFAULT_FILTERS);
	const [categories, setCategories] = useState<AccountingCategory[]>([]);
	const [subcategories, setSubcategories] = useState<AccountingSubcategory[]>([]);
	const [accountingItems, setAccountingItems] = useState<AccountingCatalogItem[]>([]);
	const [cnaeItems, setCnaeItems] = useState<CnaeCatalogItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingCatalogs, setLoadingCatalogs] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const selectedCategory = useMemo(
		() => categories.find((category) => category.code === filters.categoryCode) ?? null,
		[categories, filters.categoryCode],
	);
	const selectedSubcategory = useMemo(
		() => subcategories.find((subcategory) => subcategory.code === filters.subcategoryCode) ?? null,
		[subcategories, filters.subcategoryCode],
	);

	const loadCatalogs = useCallback(async () => {
		setLoadingCatalogs(true);
		try {
			const [categoriesResponse, subcategoriesResponse] = await Promise.all([
				api.get<AccountingCategory[]>("/api/nomenclators/accounting/categories"),
				api.get<AccountingSubcategory[]>("/api/nomenclators/accounting/subcategories"),
			]);
			setCategories(categoriesResponse.data);
			setSubcategories(subcategoriesResponse.data);
		} catch {
			setError("No se pudieron cargar las categorias del nomenclador.");
		} finally {
			setLoadingCatalogs(false);
		}
	}, []);

	const searchAccounting = useCallback(async (nextFilters: NomenclatorFilters) => {
		const params: Record<string, string | number> = { limit: resultLimit };
		if (nextFilters.query.trim()) params.q = nextFilters.query.trim();
		if (nextFilters.categoryCode) params.categoryCode = nextFilters.categoryCode;
		if (nextFilters.subcategoryCode) params.subcategoryCode = nextFilters.subcategoryCode;

		const { data } = await api.get<AccountingCatalogItem[]>("/api/nomenclators/accounting/search", { params });
		setAccountingItems(data);
	}, []);

	const searchCnae = useCallback(async (nextFilters: NomenclatorFilters) => {
		const params: Record<string, string | number> = { limit: resultLimit };
		if (nextFilters.query.trim()) params.q = nextFilters.query.trim();

		const { data } = await api.get<CnaeCatalogItem[]>("/api/nomenclators/cnae/search", { params });
		setCnaeItems(data);
	}, []);

	const search = useCallback(
		async (nextKind = kind, nextFilters = filters) => {
			setLoading(true);
			setError(null);
			try {
				if (nextKind === "accounting") {
					await searchAccounting(nextFilters);
				} else {
					await searchCnae(nextFilters);
				}
			} catch {
				setError("No se pudo consultar el nomenclador.");
			} finally {
				setLoading(false);
			}
		},
		[filters, kind, searchAccounting, searchCnae],
	);

	const updateKind = (nextKind: NomenclatorKind) => {
		const resetFilters = DEFAULT_FILTERS;
		setKind(nextKind);
		setFilters(resetFilters);
		void search(nextKind, resetFilters);
	};

	const updateQuery = (query: string) => {
		setFilters((current) => ({ ...current, query }));
	};

	const updateCategory = (categoryCode: string) => {
		const nextFilters = { ...filters, categoryCode, subcategoryCode: "" };
		setFilters(nextFilters);
		void search("accounting", nextFilters);
	};

	const updateSubcategory = (subcategoryCode: string) => {
		const nextFilters = { ...filters, subcategoryCode };
		setFilters(nextFilters);
		void search("accounting", nextFilters);
	};

	const clearFilters = () => {
		setFilters(DEFAULT_FILTERS);
		void search(kind, DEFAULT_FILTERS);
	};

	useEffect(() => {
		void loadCatalogs();
		void searchAccounting(DEFAULT_FILTERS);
	}, [loadCatalogs, searchAccounting]);

	return {
		kind,
		filters,
		categories,
		subcategories,
		selectedCategory,
		selectedSubcategory,
		accountingItems,
		cnaeItems,
		loading,
		loadingCatalogs,
		error,
		setKind: updateKind,
		setQuery: updateQuery,
		setCategory: updateCategory,
		setSubcategory: updateSubcategory,
		clearFilters,
		search: () => search(),
	};
};
