import { type FC, useState } from "react";
import { History, MoreHorizontal, PackagePlus, ShoppingCart, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CloudWorkspaceEntry } from "../../accounting/core/types/accountingTypes";
import type { PosSection } from "./types";
import { HistorySection, MoreSection, PurchaseSection, SaleSection, WarehouseSection } from "./sections";

const posSections: Array<{
	id: PosSection;
	label: string;
	icon: JSX.Element;
}> = [
	{ id: "venta", label: "Venta", icon: <ShoppingCart /> },
	{ id: "compra", label: "Compra", icon: <PackagePlus /> },
	{ id: "almacen", label: "Almacen", icon: <Warehouse /> },
	{ id: "historial", label: "Historial", icon: <History /> },
	{ id: "mas", label: "Mas", icon: <MoreHorizontal /> },
];

export const PointOfSaleView: FC<{ workspace: CloudWorkspaceEntry; selectedYear: number }> = ({ workspace, selectedYear }) => {
	const [section, setSection] = useState<PosSection>("venta");

	const renderSection = () => {
		switch (section) {
			case "venta":
				return <SaleSection workspace={workspace} selectedYear={selectedYear} />;
			case "compra":
				return <PurchaseSection workspace={workspace} selectedYear={selectedYear} />;
			case "almacen":
				return <WarehouseSection workspace={workspace} selectedYear={selectedYear} />;
			case "historial":
				return <HistorySection workspace={workspace} selectedYear={selectedYear} />;
			case "mas":
				return <MoreSection workspace={workspace} selectedYear={selectedYear} />;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
					{posSections.map((item) => (
						<Button
							key={item.id}
							type="button"
							variant="ghost"
							onClick={() => setSection(item.id)}
							className={cn(
								"justify-start gap-2 rounded-md [&_svg]:size-4",
								section === item.id
									? "bg-emerald-100 text-emerald-950 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-100"
									: "text-slate-600 dark:text-slate-300",
							)}
						>
							{item.icon}
							{item.label}
						</Button>
					))}
				</div>
			</div>
			{renderSection()}
		</div>
	);
};
