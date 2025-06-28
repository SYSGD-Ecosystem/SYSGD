import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "./ui/badge";
import { Mail } from "lucide-react";
import type { Employee } from "../types/organigrama";

interface EmployeeCardProps {
	employee: Employee;
	level: number;
}

export function EmployeeCard({ employee, level }: EmployeeCardProps) {
	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word.charAt(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const getDepartmentColor = (department: string) => {
		const colors = {
			"Dirección General":
				"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
			Tecnología:
				"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
			Desarrollo:
				"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
			Infraestructura:
				"bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
			Finanzas:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
			Contabilidad:
				"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
			Ventas: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
		};
		return (
			colors[department as keyof typeof colors] ||
			"bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
		);
	};

	const getCardSize = (level: number) => {
		switch (level) {
			case 0:
				return "w-72 h-32"; // CEO
			case 1:
				return "w-64 h-28"; // C-Level
			case 2:
				return "w-56 h-24"; // Managers
			default:
				return "w-48 h-20"; // Employees
		}
	};

	return (
		<Card
			className={`${getCardSize(level)} shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20`}
		>
			<CardContent className="p-4 h-full flex flex-col justify-between">
				<div className="flex items-start space-x-3">
					<Avatar
						className={`${level === 0 ? "h-12 w-12" : level === 1 ? "h-10 w-10" : "h-8 w-8"} ring-2 ring-primary/10`}
					>
						<AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
							{getInitials(employee.name)}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<h3
							className={`font-bold text-foreground truncate ${level === 0 ? "text-lg" : level === 1 ? "text-base" : "text-sm"}`}
						>
							{employee.name}
						</h3>
						<p
							className={`text-muted-foreground truncate ${level === 0 ? "text-sm" : "text-xs"}`}
						>
							{employee.position}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-between mt-2">
					<Badge
						className={`${getDepartmentColor(employee.department)} text-xs`}
					>
						{employee.department}
					</Badge>
					{level <= 1 && <Mail className="h-3 w-3 text-muted-foreground" />}
				</div>
			</CardContent>
		</Card>
	);
}
