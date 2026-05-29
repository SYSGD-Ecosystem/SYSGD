import {
	BarChart3,
	Blocks,
	BookOpen,
	CircleHelp,
	CreditCard,
	HandCoins,
	DatabaseBackup,
	FileText,
	Info,
	Landmark,
	LayoutDashboard,
	List,
	NotebookText,
	Search,
	Shield,
	ShoppingCart,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import type { GcTcpView, NavigationSection } from "./types";

export const navigationSections: NavigationSection[] = [
	{
		title: "Inicio",
		items: [{ id: "dashboard", label: "Dashboard", icon: <BarChart3 /> }],
	},
	{
		title: "Registro Contable DJ",
		items: [
			{ id: "generales", label: "General", icon: <BookOpen /> },
			{ id: "ingresos", label: "Ingresos", icon: <TrendingUp /> },
			{ id: "gastos", label: "Gastos", icon: <TrendingDown /> },
			{ id: "tributos", label: "Tributos", icon: <Landmark /> },
			{ id: "resumen", label: "Resumen", icon: <LayoutDashboard /> },
			{ id: "estadoResultado", label: "Libro de ingresos y gastos", icon: <NotebookText /> },
			{ id: "libroDiario", label: "Libro Diario", icon: <NotebookText /> },
		],
	},
	{
		title: "Herramientas",
		items: [
			{ id: "cajaBanco", label: "Caja y banco", icon: <HandCoins /> },
			{ id: "ventas", label: "Punto de Venta", icon: <ShoppingCart /> },
			{ id: "nomencladores", label: "Nomencladores", icon: <List /> },
			{ id: "terceros", label: "Terceros", icon: <Users /> },
			{ id: "documentos", label: "Documentos", icon: <FileText /> },
		],
	},
	{
		title: "Catalogo",
		items: [{ id: "catalogos", label: "Cuentas y Productos", icon: <Blocks /> }],
	},
	{
		title: "Cuenta y plataforma",
		items: [
			{ id: "seguridad", label: "Seguridad y cuenta", icon: <Shield /> },
			{ id: "licencias", label: "Licencias y creditos", icon: <CreditCard /> },
			{ id: "respaldo", label: "Respaldo y acceso", icon: <DatabaseBackup /> },
			{ id: "acerca", label: "Acerca de", icon: <Info /> },
		],
	},
	{
		title: "Guias y apoyo",
		items: [
			{ id: "ayuda", label: "Ayuda de llenado", icon: <CircleHelp /> },
			{ id: "recursos", label: "Recursos utiles", icon: <Search /> },
		],
	},
];

export const getViewTitle = (view: GcTcpView): string => {
	for (const section of navigationSections) {
		const item = section.items.find((entry) => entry.id === view);
		if (item) return item.label;
	}
	return "Gestor Contable TCP";
};
