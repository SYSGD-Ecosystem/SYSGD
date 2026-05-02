import type { FC, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export const PosSummary: FC<{
	title: string;
	value: string;
	detail: string;
	icon: ReactNode;
}> = ({ title, value, detail, icon }) => (
	<Card className="rounded-lg shadow-sm">
		<CardContent className="flex items-start justify-between gap-3 p-4">
			<div className="min-w-0">
				<p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
				<p className="mt-2 break-words text-2xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
				<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
			</div>
			<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 [&_svg]:size-5">
				{icon}
			</div>
		</CardContent>
	</Card>
);
