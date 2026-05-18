import type { FC, ReactNode } from "react";
import { Trash2, WalletCards, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney } from "./accountingMath";
import { navigationSections } from "./navigation";
import type { GcTcpView, NavigationItem, WorkspaceAnalysis } from "./types";

export const MetricCard: FC<{
	title: string;
	value: string;
	detail: string;
	icon: ReactNode;
	accent: string;
}> = ({ title, value, detail, icon, accent }) => (
	<Card className="rounded-lg shadow-sm">
		<CardContent className="p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
					<p className="mt-2 break-words text-2xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
					<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
				</div>
				<div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md [&_svg]:size-5", accent)}>
					{icon}
				</div>
			</div>
		</CardContent>
	</Card>
);

export const EmptyState: FC<{ title: string; description: string; icon: ReactNode }> = ({ title, description, icon }) => (
	<div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
		<div className="mb-3 flex size-11 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 [&_svg]:size-5">
			{icon}
		</div>
		<h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
		<p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
	</div>
);

const SidebarButton: FC<{
	item: NavigationItem;
	selected: boolean;
	onSelect: (view: GcTcpView) => void;
}> = ({ item, selected, onSelect }) => (
	<button
		type="button"
		onClick={() => onSelect(item.id)}
		className={cn(
			"flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors [&_svg]:size-4",
			selected
				? "bg-emerald-100 font-medium text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-100"
				: "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50",
		)}
	>
		<span className="shrink-0">{item.icon}</span>
		<span className="min-w-0 break-words">{item.label}</span>
	</button>
);

export const GcTcpSidebar: FC<{
	view: GcTcpView;
	onSelect: (view: GcTcpView) => void;
	onClose?: () => void;
}> = ({ view, onSelect, onClose }) => {
	const handleSelect = (nextView: GcTcpView) => {
		onSelect(nextView);
		onClose?.();
	};

	return (
		<aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
				<div className="flex min-w-0 items-center gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
						<WalletCards className="size-5" />
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">Gestor Contable TCP</p>
						<p className="truncate text-xs text-slate-500 dark:text-slate-400">Version escritorio</p>
					</div>
				</div>
				{onClose && (
					<Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar menu">
						<X />
					</Button>
				)}
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				{navigationSections.map((section) => (
					<div key={section.title} className="mb-4">
						<p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
							{section.title}
						</p>
						<div className="space-y-1">
							{section.items.map((item) => (
								<SidebarButton key={item.id} item={item} selected={item.id === view} onSelect={handleSelect} />
							))}
						</div>
					</div>
				))}
			</div>
		</aside>
	);
};

export const WorkspaceSelector: FC<{
	analyses: WorkspaceAnalysis[];
	activeWorkspaceId: string;
	onSelect: (workspaceId: string) => void;
	onRequestDelete: (workspaceId: string) => void;
	savingWorkspace: boolean;
}> = ({ analyses, activeWorkspaceId, onSelect, onRequestDelete, savingWorkspace }) => (
	<div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
		{analyses.map((analysis) => {
			const selected = analysis.workspace.id === activeWorkspaceId;
			return (
				<div
					key={analysis.workspace.id}
					className={cn(
						"rounded-lg border bg-white p-4 text-left transition-colors dark:bg-slate-900",
						selected
							? "border-emerald-500 ring-2 ring-emerald-500/20"
							: "border-slate-200 hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-700",
					)}
				>
					<button
						type="button"
						onClick={() => onSelect(analysis.workspace.id)}
						className="w-full text-left"
						disabled={savingWorkspace}
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="truncate font-semibold text-slate-950 dark:text-slate-50">{analysis.workspace.name}</p>
								<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
									{analysis.workspace.registro.generales.nombre || "Sin nombre fiscal"}
								</p>
							</div>
							{selected && <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Activo</Badge>}
						</div>
						<div className="mt-4 grid grid-cols-3 gap-2 text-xs">
							<div>
								<p className="text-slate-500 dark:text-slate-400">Neto</p>
								<p className="font-semibold text-slate-950 dark:text-slate-50">{formatMoney(analysis.baseImponible)}</p>
							</div>
							<div>
								<p className="text-slate-500 dark:text-slate-400">Asientos</p>
								<p className="font-semibold text-slate-950 dark:text-slate-50">{analysis.incomeRows + analysis.expenseRows}</p>
							</div>
							<div>
								<p className="text-slate-500 dark:text-slate-400">Ficha</p>
								<p className="font-semibold text-slate-950 dark:text-slate-50">{analysis.completenessScore}%</p>
							</div>
						</div>
					</button>
					<div className="mt-4 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
							onClick={() => onRequestDelete(analysis.workspace.id)}
							disabled={savingWorkspace || analyses.length <= 1}
						>
							<Trash2 className="size-4" />
							Eliminar
						</Button>
					</div>
				</div>
			);
		})}
	</div>
);
