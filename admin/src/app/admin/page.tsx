import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminMetrics } from "@/hooks/connection/useAdminMetrics";
import { Users, TrendingUp, FolderKanban, BookOpen, CreditCard } from "lucide-react";

export default function AdminDashboard() {
	const { metrics, loading } = useAdminMetrics();

	const formatNumber = (num: number | undefined) => {
		if (loading || num === undefined) return "...";
		return num.toLocaleString();
	};

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
				<p className="text-muted-foreground">
					Bienvenido al panel de administración de SYSGD
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Usuarios
						</CardTitle>
						<Users className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-foreground">
							{formatNumber(metrics?.general.totalUsers)}
						</p>
						<p className="text-sm text-muted-foreground">
							Usuarios registrados en el sistema
						</p>
					</CardContent>
				</Card>
				<Card className="border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Proyectos
						</CardTitle>
						<FolderKanban className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-foreground">
							{formatNumber(metrics?.general.totalProjects)}
						</p>
						<p className="text-sm text-muted-foreground">
							Proyectos en la plataforma
						</p>
					</CardContent>
				</Card>
				<Card className="border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Tareas
						</CardTitle>
						<TrendingUp className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-foreground">
							{formatNumber(metrics?.general.totalTasks)}
						</p>
						<p className="text-sm text-muted-foreground">
							Tareas creadas en proyectos
						</p>
					</CardContent>
				</Card>
				<Card className="border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Registros Contables
						</CardTitle>
						<BookOpen className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-foreground">
							{formatNumber(metrics?.general.totalRegistrosContables)}
						</p>
						<p className="text-sm text-muted-foreground">
							Usuarios con registro contable
						</p>
					</CardContent>
				</Card>
			</div>

			{metrics && (
				<>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<Card className="border-border">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Usuarios con Registro Contable
								</CardTitle>
								<BookOpen className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold text-foreground">
									{formatNumber(metrics.contabilidad.usuariosActivos)}
								</p>
								<p className="text-sm text-muted-foreground">
									Usuarios activos en contabilidad
								</p>
							</CardContent>
						</Card>
						<Card className="border-border">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Usuarios con Proyectos
								</CardTitle>
								<FolderKanban className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold text-foreground">
									{formatNumber(metrics.proyectos.usuarios.filter(u => u.proyectosCount > 0).length)}
								</p>
								<p className="text-sm text-muted-foreground">
									Usuarios con proyectos activos
								</p>
							</CardContent>
						</Card>
						<Card className="border-border">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Tareas en Proyectos
								</CardTitle>
								<TrendingUp className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold text-foreground">
									{formatNumber(metrics.proyectos.usuarios.reduce((acc, u) => acc + u.tareasCount, 0))}
								</p>
								<p className="text-sm text-muted-foreground">
									Tareas totales en proyectos
								</p>
							</CardContent>
						</Card>
					</div>

					<Card className="border-border">
						<CardHeader>
							<CardTitle>Detalle de Usuarios</CardTitle>
							<p className="text-sm text-muted-foreground">
								Información de proyectos, registros contables y créditos por usuario
							</p>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b">
											<th className="text-left py-2 px-2">Usuario</th>
											<th className="text-center py-2 px-2">Proyectos</th>
											<th className="text-center py-2 px-2">Tareas</th>
											<th className="text-center py-2 px-2">Registro Contable</th>
											<th className="text-center py-2 px-2">Créditos</th>
										</tr>
									</thead>
									<tbody>
										{metrics.proyectos.usuarios.map((usuario) => (
											<tr key={usuario.userId} className="border-b last:border-0">
												<td className="py-2 px-2">
													<div className="font-medium">{usuario.nombre}</div>
													<div className="text-xs text-muted-foreground">{usuario.email}</div>
												</td>
												<td className="text-center py-2 px-2">{usuario.proyectosCount}</td>
												<td className="text-center py-2 px-2">{usuario.tareasCount}</td>
												<td className="text-center py-2 px-2">
													{metrics.contabilidad.usuarios.find(u => u.userId === usuario.userId)?.tieneRegistro ? (
														<span className="text-green-600">Sí</span>
													) : (
														<span className="text-muted-foreground">No</span>
													)}
												</td>
												<td className="text-center py-2 px-2">
													<div className="flex items-center justify-center gap-1">
														<CreditCard className="w-3 h-3" />
														{usuario.creditos}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
