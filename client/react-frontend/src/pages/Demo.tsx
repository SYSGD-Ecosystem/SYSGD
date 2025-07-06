import { useState } from "react";
import {
	Home,
	FileText,
	Database,
	ArrowRight,
	ArrowLeft,
	CreditCard,
	// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
	Map,
	Plus,
	Save,
	Bell,
	User,
	Sun,
	Moon,
	Github,
	Facebook,
	Twitter,
	HelpCircle,
	Menu,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DocumentRow {
	id: string;
	codigo: string;
	serie: string;
}

export default function SYSGDDashboard() {
	const [darkMode, setDarkMode] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [documentRows, setDocumentRows] = useState<DocumentRow[]>([
		{ id: "1", codigo: "OT37.1.1", serie: "Dirección" },
		{ id: "2", codigo: "OT37.1.2", serie: "Planificación" },
	]);
	const [selectedArchive, setSelectedArchive] = useState("gestion-documental");

	const menuItems = [
		{ icon: Home, label: "CUADRO DE CLASIFICACIÓN", active: true },
		{ icon: Database, label: "TABLA DE RETENCIÓN...", active: false },
		{ icon: ArrowRight, label: "REGISTRO DE ENTRADA", active: false },
		{ icon: ArrowLeft, label: "REGISTRO DE SALIDA", active: false },
		{ icon: CreditCard, label: "REGISTRO DE PRÉSTAMO", active: false },
		{ icon: Map, label: "REGISTRO TOPOGRÁFICO", active: false },
	];

	const addNewRow = () => {
		const newRow: DocumentRow = {
			id: Date.now().toString(),
			codigo: "",
			serie: "",
		};
		setDocumentRows([...documentRows, newRow]);
	};

	const updateRow = (id: string, field: keyof DocumentRow, value: string) => {
		setDocumentRows(
			documentRows.map((row) =>
				row.id === id ? { ...row, [field]: value } : row,
			),
		);
	};

	const deleteRow = (id: string) => {
		setDocumentRows(documentRows.filter((row) => row.id !== id));
	};

	const saveChanges = () => {
		// Simulate save operation
		console.log("Guardando cambios:", documentRows);
		// Here you would typically send data to your backend
	};

	const Sidebar = ({ mobile = false }) => (
		<div
			className={`${mobile ? "w-full" : "w-64"} bg-slate-800 border-r border-slate-700 flex flex-col h-full`}
		>
			<div className="p-4 border-b border-slate-700">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
						<FileText className="w-4 h-4 text-white" />
					</div>
					<span className="text-white font-semibold text-lg">SYSGD</span>
				</div>
			</div>

			<nav className="flex-1 p-4 space-y-2">
				{menuItems.map((item, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					<TooltipProvider key={index}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant={item.active ? "secondary" : "ghost"}
									className={`w-full justify-start text-left h-auto p-3 ${
										item.active
											? "bg-blue-600 text-white hover:bg-blue-700"
											: "text-slate-300 hover:text-white hover:bg-slate-700"
									}`}
								>
									<item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
									<span className="text-sm truncate">{item.label}</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right">
								<p>{item.label}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				))}
			</nav>

			<div className="p-4 border-t border-slate-700">
				<div className="flex items-center justify-between">
					<span className="text-slate-400 text-sm">LazarOS</span>
					<div className="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							className="text-slate-400 hover:text-white p-1"
						>
							<Github className="w-4 h-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-slate-400 hover:text-white p-1"
						>
							<Facebook className="w-4 h-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-slate-400 hover:text-white p-1"
						>
							<Twitter className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
			<div className="bg-slate-900 text-white min-h-screen flex">
				{/* Desktop Sidebar */}
				<div className="hidden lg:block">
					<Sidebar />
				</div>

				{/* Mobile Sidebar */}
				<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
					<SheetContent side="left" className="p-0 w-64">
						<Sidebar mobile />
					</SheetContent>
				</Sheet>

				{/* Main Content */}
				<div className="flex-1 flex flex-col">
					{/* Header */}
					<header className="bg-slate-800 border-b border-slate-700 p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<Sheet>
									<SheetTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="lg:hidden text-white"
										>
											<Menu className="w-5 h-5" />
										</Button>
									</SheetTrigger>
								</Sheet>

								<div className="flex items-center gap-2">
									<span className="text-slate-400">Archivo de Gestión:</span>
									<Select
										value={selectedArchive}
										onValueChange={setSelectedArchive}
									>
										<SelectTrigger className="w-64 bg-slate-700 border-slate-600 text-white">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="gestion-documental">
												📄 Gestión Documental
											</SelectItem>
											<SelectItem value="archivo-central">
												🏢 Archivo Central
											</SelectItem>
											<SelectItem value="archivo-historico">
												📚 Archivo Histórico
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setDarkMode(!darkMode)}
												className="text-slate-300 hover:text-white"
											>
												{darkMode ? (
													<Sun className="w-4 h-4" />
												) : (
													<Moon className="w-4 h-4" />
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Cambiar tema</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								<Button
									variant="ghost"
									size="sm"
									className="text-slate-300 hover:text-white"
								>
									<Bell className="w-4 h-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="text-slate-300 hover:text-white"
								>
									<User className="w-4 h-4" />
								</Button>
								<span className="text-slate-400 text-sm">Acerca de...</span>
								<Button
									variant="ghost"
									size="sm"
									className="text-slate-300 hover:text-white"
								>
									<HelpCircle className="w-4 h-4" />
								</Button>
							</div>
						</div>
					</header>

					{/* Main Content Area */}
					<div className="flex-1 flex">
						<main className="flex-1 p-6 overflow-auto">
							<Card className="bg-slate-800 border-slate-700">
								<CardHeader className="text-center">
									<div className="flex justify-between items-start mb-4">
										<Badge
											variant="outline"
											className="text-slate-300 border-slate-600"
										>
											ANEXO
										</Badge>
										<Badge
											variant="outline"
											className="text-slate-300 border-slate-600"
										>
											A1
										</Badge>
									</div>
									<CardTitle className="text-2xl text-white mb-2">
										CUADRO DE CLASIFICACIÓN
									</CardTitle>
									<p className="text-lg text-slate-300 mb-4">UNISOFT</p>
									<div className="text-left">
										<p className="text-slate-400 mb-2">
											<strong>ARCHIVO DE GESTIÓN:</strong> OT001 GESTIÓN
											DOCUMENTAL
										</p>
										<p className="text-slate-400 mb-4">
											<strong>DOCUMENTOS GENERADOS</strong>
										</p>
									</div>
								</CardHeader>

								<CardContent>
									<div className="overflow-x-auto">
										<table className="w-full border-collapse">
											<thead>
												<tr className="border-b border-slate-600">
													<th className="text-left p-3 text-slate-300 font-medium">
														CÓDIGO
													</th>
													<th className="text-left p-3 text-slate-300 font-medium">
														SERIES Y SUBSERIES DOCUMENTALES
													</th>
													<th className="text-right p-3 text-slate-300 font-medium">
														ACCIONES
													</th>
												</tr>
											</thead>
											<tbody>
												{documentRows.map((row) => (
													<tr
														key={row.id}
														className="border-b border-slate-700 hover:bg-slate-700/50"
													>
														<td className="p-3">
															<Input
																value={row.codigo}
																onChange={(e) =>
																	updateRow(row.id, "codigo", e.target.value)
																}
																className="bg-slate-700 border-slate-600 text-white"
																placeholder="Código"
															/>
														</td>
														<td className="p-3">
															<Input
																value={row.serie}
																onChange={(e) =>
																	updateRow(row.id, "serie", e.target.value)
																}
																className="bg-slate-700 border-slate-600 text-white"
																placeholder="Serie documental"
															/>
														</td>
														<td className="p-3 text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => deleteRow(row.id)}
																className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
															>
																<X className="w-4 h-4" />
															</Button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>

									<div className="flex gap-4 mt-6">
										<Button
											onClick={addNewRow}
											className="bg-slate-600 hover:bg-slate-500 text-white"
										>
											<Plus className="w-4 h-4 mr-2" />
											AÑADIR FILA
										</Button>
										<Button
											onClick={saveChanges}
											className="bg-blue-600 hover:bg-blue-700 text-white"
										>
											<Save className="w-4 h-4 mr-2" />
											GUARDAR
										</Button>
									</div>
								</CardContent>
							</Card>
						</main>

						{/* Right Sidebar */}
						<aside className="hidden xl:block w-80 bg-slate-800 border-l border-slate-700 p-6">
							<Card className="bg-slate-700 border-slate-600">
								<CardHeader>
									<CardTitle className="text-white flex items-center gap-2">
										<HelpCircle className="w-5 h-5" />
										Código
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-slate-300 text-sm leading-relaxed mb-4">
										Cada documento se identifica con un código único, estos
										pueden ser alfanuméricos y deberían estar directamente
										relacionado con el organigrama archivístico funcional
									</p>
									<Button
										variant="link"
										className="text-blue-400 hover:text-blue-300 p-0 h-auto"
									>
										Saber más...
									</Button>
								</CardContent>
							</Card>
						</aside>
					</div>
				</div>
			</div>
		</div>
	);
}