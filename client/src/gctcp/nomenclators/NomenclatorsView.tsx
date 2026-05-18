import type { FC, FormEvent } from "react";
import { Building2, Filter, ListTree, Loader2, Search, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AccountingResults, CnaeResults } from "./NomenclatorResults";
import type { NomenclatorKind } from "./types";
import { useNomenclators } from "./useNomenclators";

const allOption = "__all__";

const typeOptions: Array<{ value: NomenclatorKind; label: string; icon: JSX.Element }> = [
	{ value: "accounting", label: "Contabilidad", icon: <Building2 /> },
	{ value: "cnae", label: "CNAE", icon: <ListTree /> },
];

export const NomenclatorsView: FC = () => {
	const nomenclators = useNomenclators();

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void nomenclators.search();
	};

	return (
		<div className="space-y-4">
			<Card className="rounded-lg shadow-sm">
				<CardHeader className="p-4 pb-3">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<CardTitle className="text-base">Nomencladores</CardTitle>
							<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
								Consulta CNAE y nomenclador contable desde los endpoints del servidor.
							</p>
						</div>
						<Badge variant="outline">
							{nomenclators.kind === "accounting"
								? `${nomenclators.accountingItems.length} resultados`
								: `${nomenclators.cnaeItems.length} resultados`}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4 p-4 pt-0">
					<div className="grid gap-2 sm:grid-cols-2">
						{typeOptions.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => nomenclators.setKind(option.value)}
								className={cn(
									"flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors [&_svg]:size-4",
									nomenclators.kind === option.value
										? "border-emerald-500 bg-emerald-100 font-medium text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-100"
										: "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
								)}
							>
								{option.icon}
								{option.label}
							</button>
						))}
					</div>

					<form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
							<Input
								value={nomenclators.filters.query}
								onChange={(event) => nomenclators.setQuery(event.target.value)}
								placeholder={
									nomenclators.kind === "accounting"
										? "Buscar por codigo, cuenta, subcuenta o categoria"
										: "Buscar por codigo, descripcion, estructura o seccion"
								}
								className="pl-9"
							/>
						</div>
						<Button type="submit" disabled={nomenclators.loading}>
							{nomenclators.loading ? <Loader2 className="animate-spin" /> : <Search />}
							Buscar
						</Button>
						<Button type="button" variant="outline" onClick={nomenclators.clearFilters} disabled={nomenclators.loading}>
							<X />
							Limpiar
						</Button>
					</form>

					{nomenclators.kind === "accounting" && (
						<div className="grid gap-3 lg:grid-cols-2">
							<div>
								<label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
									Categoria
								</label>
								<Select
									value={nomenclators.filters.categoryCode || allOption}
									onValueChange={(value) => nomenclators.setCategory(value === allOption ? "" : value)}
									disabled={nomenclators.loadingCatalogs}
								>
									<SelectTrigger>
										<SelectValue placeholder="Todas las categorias" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={allOption}>Todas las categorias</SelectItem>
										{nomenclators.categories.map((category) => (
											<SelectItem key={category.code} value={category.code}>
												{category.code} - {category.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
									Subcategoria
								</label>
								<Select
									value={nomenclators.filters.subcategoryCode || allOption}
									onValueChange={(value) => nomenclators.setSubcategory(value === allOption ? "" : value)}
									disabled={nomenclators.loadingCatalogs}
								>
									<SelectTrigger>
										<SelectValue placeholder="Todas las subcategorias" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={allOption}>Todas las subcategorias</SelectItem>
										{nomenclators.subcategories.map((subcategory) => (
											<SelectItem key={subcategory.code} value={subcategory.code}>
												{subcategory.code} - {subcategory.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					{(nomenclators.selectedCategory || nomenclators.selectedSubcategory) && (
						<div className="flex flex-wrap items-center gap-2 text-sm">
							<Filter className="size-4 text-slate-500" />
							{nomenclators.selectedCategory && (
								<Badge variant="secondary">Cat. {nomenclators.selectedCategory.code}</Badge>
							)}
							{nomenclators.selectedSubcategory && (
								<Badge variant="secondary">Sub. {nomenclators.selectedSubcategory.code}</Badge>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{nomenclators.error && (
				<Alert variant="destructive">
					<AlertDescription>{nomenclators.error}</AlertDescription>
				</Alert>
			)}

			{nomenclators.loading ? (
				<div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
					<Loader2 className="size-6 animate-spin text-emerald-600" />
				</div>
			) : nomenclators.kind === "accounting" ? (
				<AccountingResults items={nomenclators.accountingItems} />
			) : (
				<CnaeResults items={nomenclators.cnaeItems} />
			)}
		</div>
	);
};
