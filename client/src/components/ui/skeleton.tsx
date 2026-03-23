import { cn } from "@/lib/utils";

interface SkeletonProps {
	className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-full bg-slate-300 dark:bg-slate-600",
				className,
			)}
		/>
	);
}
