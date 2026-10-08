import { useState } from "react";

export interface MiniBarChartPoint {
	key: string;
	label: string;
	value: number;
	/** Línea adicional en el tooltip (ej. "3 órdenes"). */
	extra?: string;
	/** Etiqueta corta del eje (por defecto se usa `label`). */
	axisLabel?: string;
}

export function MiniBarChart({
	data,
	colorClass,
	emptyLabel,
	formatValue,
	showAxisLabels = false,
}: {
	data: MiniBarChartPoint[];
	colorClass: string;
	emptyLabel: string;
	formatValue?: (value: number) => string;
	showAxisLabels?: boolean;
}) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const maxValue = Math.max(...data.map((item) => item.value), 1);
	const hasValues = data.some((item) => item.value > 0);

	if (data.length === 0) {
		return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
	}

	if (!hasValues) {
		return (
			<div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
				Sin valores en este rango
			</div>
		);
	}

	const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;
	const tooltipLeft =
		hoveredIndex === null || data.length <= 1
			? 50
			: (hoveredIndex / (data.length - 1)) * 100;

	return (
		<div>
			<div className="relative h-44 flex items-stretch gap-1.5">
				{hoveredItem && (
					<div
						className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 -translate-y-1 rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg"
						style={{ left: `${tooltipLeft}%` }}
					>
						<div className="font-medium">{hoveredItem.label}</div>
						<div>
							{formatValue ? formatValue(hoveredItem.value) : hoveredItem.value}
						</div>
						{hoveredItem.extra && (
							<div className="text-slate-300">{hoveredItem.extra}</div>
						)}
					</div>
				)}
				{data.map((item, index) => (
					<div
						key={item.key}
						className="h-full flex-1 min-w-0 flex flex-col items-center justify-end gap-2"
						onMouseEnter={() => setHoveredIndex(index)}
						onMouseLeave={() => setHoveredIndex(null)}
					>
						<div
							className={`w-full min-h-1 rounded-t-sm ${colorClass}`}
							style={{ height: `${Math.max((item.value / maxValue) * 100, 4)}%` }}
							aria-label={`${item.label}: ${item.value}`}
						/>
					</div>
				))}
			</div>
			{showAxisLabels && (
				<div className="mt-2 flex items-stretch gap-1.5">
					{data.map((item) => (
						<div
							key={`axis-${item.key}`}
							className="flex-1 min-w-0 text-center text-[10px] text-muted-foreground truncate"
						>
							{item.axisLabel ?? item.label}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
