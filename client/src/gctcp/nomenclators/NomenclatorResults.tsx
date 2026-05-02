import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "../components";
import { BookOpen, ListTree } from "lucide-react";
import type { AccountingCatalogItem, CnaeCatalogItem } from "./types";

export const AccountingResults: FC<{ items: AccountingCatalogItem[] }> = ({ items }) => {
	if (items.length === 0) {
		return (
			<EmptyState
				title="Sin resultados contables"
				description="Ajusta la busqueda o los filtros para consultar el nomenclador contable."
				icon={<BookOpen />}
			/>
		);
	}

	return (
		<div className="grid gap-3 xl:grid-cols-2">
			{items.map((item) => (
				<Card key={`${item.displayCode}-${item.categoryCode}-${item.subcategoryCode}`} className="rounded-lg shadow-sm">
					<CardContent className="p-4">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="break-words text-base font-semibold text-slate-950 dark:text-slate-50">
									{item.displayCode} / {item.displayName}
								</p>
								<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
									{item.categoryCode} - {item.categoryName}
								</p>
							</div>
							<div className="flex gap-2">
								<Badge variant="outline">{item.itemType}</Badge>
								<Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{item.displayNature}</Badge>
							</div>
						</div>
						<div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
							<div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
								<p className="text-xs uppercase text-slate-500 dark:text-slate-400">Cuenta</p>
								<p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{item.accountCode} / {item.accountName}</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">{item.accountNature}</p>
							</div>
							<div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
								<p className="text-xs uppercase text-slate-500 dark:text-slate-400">Subcategoria</p>
								<p className="mt-1 font-medium text-slate-950 dark:text-slate-50">
									{item.subcategoryCode ? `${item.subcategoryCode} / ${item.subcategoryName}` : "Sin subcategoria"}
								</p>
							</div>
						</div>
						{item.subaccountCode && (
							<div className="mt-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
								<p className="font-medium text-slate-950 dark:text-slate-50">
									Subcuenta {item.subaccountCode} / {item.subaccountName}
								</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">Naturaleza: {item.subaccountNature || item.displayNature}</p>
							</div>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
};

export const CnaeResults: FC<{ items: CnaeCatalogItem[] }> = ({ items }) => {
	if (items.length === 0) {
		return (
			<EmptyState
				title="Sin resultados CNAE"
				description="Busca por codigo, estructura, seccion o descripcion para encontrar actividades economicas."
				icon={<ListTree />}
			/>
		);
	}

	return (
		<div className="grid gap-3">
			{items.map((item) => (
				<Card key={item.code} className="rounded-lg shadow-sm">
					<CardContent className="p-4">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="break-words text-base font-semibold text-slate-950 dark:text-slate-50">{item.description}</p>
								<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
									{item.code} / {item.structure} / Seccion {item.section}
								</p>
							</div>
							<Badge variant="outline">CNAE</Badge>
						</div>
						{item.notes.length > 0 && (
							<div className="mt-4 rounded-md bg-slate-100 p-3 dark:bg-slate-800">
								<p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Notas</p>
								<div className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-300">
									{item.notes.slice(0, 4).map((note) => (
										<p key={note}>{note}</p>
									))}
								</div>
							</div>
						)}
						{item.correlations.length > 0 && (
							<div className="mt-4 grid gap-2 md:grid-cols-2">
									{item.correlations.map((correlation) => (
										<div key={`${correlation.codeNae}-${correlation.codeCiiu}`} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
											<p className="font-medium text-slate-950 dark:text-slate-50">
												{`${correlation.codeCnae} -> ${correlation.codeNae} -> ${correlation.codeCiiu}`}
											</p>
										<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{correlation.descriptionNae || correlation.descriptionCiiu}</p>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
};
