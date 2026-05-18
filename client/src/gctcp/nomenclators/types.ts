export type NomenclatorKind = "accounting" | "cnae";

export type AccountingCategory = {
	code: string;
	name: string;
};

export type AccountingSubcategory = {
	code: string;
	name: string;
};

export type AccountingCatalogItem = {
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
};

export type CnaeCorrelation = {
	codeCnae: string;
	descriptionCnae: string;
	codeNae: string;
	descriptionNae: string;
	codeCiiu: string;
	descriptionCiiu: string;
};

export type CnaeCatalogItem = {
	section: string;
	structure: string;
	code: string;
	description: string;
	notes: string[];
	correlations: CnaeCorrelation[];
};

export type NomenclatorFilters = {
	query: string;
	categoryCode: string;
	subcategoryCode: string;
};
