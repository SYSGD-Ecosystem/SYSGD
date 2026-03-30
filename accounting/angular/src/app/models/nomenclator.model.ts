export interface AccountingCategory {
  code: string;
  name: string;
}

export interface AccountingSubcategory {
  code: string;
  name: string;
}

export interface AccountingItem {
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

export interface CnaeCorrelation {
  codeCnae: string;
  descriptionCnae: string;
  codeNae: string;
  descriptionNae: string;
  codeCiiu: string;
  descriptionCiiu: string;
}

export interface CnaeItem {
  section: string;
  structure: string;
  code: string;
  description: string;
  notes: string[];
  correlations: CnaeCorrelation[];
}
