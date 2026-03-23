import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AppsPage() {
	return (
		<div className="py-16 md:py-24">
			<div className="container mx-auto px-4 md:px-6">
				<div className="max-w-3xl mx-auto text-center mb-16">
					<h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
						Apps y Software
					</h1>
					<p className="text-lg text-muted-foreground text-pretty">
						Centro de desarrollo de software y aplicaciones para el entorno de SYSGD Ecosystem
					</p>
				</div>

				<div className="max-w-5xl mx-auto space-y-12">
					<div className="prose prose-lg max-w-none">
						<p className="text-lg leading-relaxed text-muted-foreground">
							En SYSGD Ecosystem, estamos revolucionando la productividad
							empresarial con nuestras últimas aplicaciones y software. Nos
							comprometemos con el desarrollo de apps profecionales que
							optimizan la gestión de trabajo, la gestión conable y la mejora
							continua de sus procesos.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<Card className="p-6 md:p-8">
							<div className="flex items-start gap-4">
								<div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center">
									<img
										alt="Icono de gestor contable TCP"
										src="/ic_gestor_contable_tcp.png"
										className="w-full h-full text-primary"
									/>
								</div>
								<div className="flex flex-col">
									<h3 className="text-xl font-semibold mb-2">
										Gestor Contable TCP
									</h3>
									<p className="text-muted-foreground leading-relaxed text-justify">
										Gestor Contable TCP es la app que te ayudará a gestionar tu
										negocio de forma eficiente, permitiendote Registrar gastos e
										ingresos desde tu móvil. Incorpora demas una herramienta
										para la gestion de compras y ventas en los puntos de ventas,
										y el Nomesclador CNAE.
									</p>
                                    <div className="flex gap-5">
										<div className="flex items-center gap-2 text-sm text-gray-700">
											<div className="h-2 w-2 rounded-full bg-green-500" />
											<span>Android</span>
										</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
											<div className="h-2 w-2 rounded-full bg-orange-500" />
											<span>Apklis</span>
										</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
											<div className="h-2 w-2 rounded-full bg-blue-500" />
											<span>Cuba</span>
										</div>
									</div>
									<div className="flex justify-end items-end w-full mt-2">
										<Button asChild className="rounded-full">
											<a
												href="https://www.apklis.cu/application/cu.lazaroysr96.sysgdcont"
												target="_blank"
												rel="noopener noreferrer"
											>
												Instalar
											</a>
										</Button>
									</div>
								</div>
							</div>
						</Card>

						<Card className="p-6 md:p-8">
							<div className="flex items-start gap-4">
								<div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center">
									<img
										alt="IC CNAE"
										src="/ic_cnae.png"
										className="w-full h-full text-primary"
									/>
								</div>
								<div>
									<h3 className="text-xl font-semibold mb-2">
										Nomesclatura CNAE Pro
									</h3>
									<p className="text-muted-foreground leading-relaxed text-justify">
										Esta app presenta un nombrezador del Clasificador Nacional
										de Actividades Económicas, es una excelente herramienta de
										referencia que no te puede faltar como contador, y además,
										agregamos los nomencladores de cuentas contables.
									</p>
									<div className="flex gap-5">
										<div className="flex items-center gap-2 text-sm text-gray-700">
											<div className="h-2 w-2 rounded-full bg-green-500" />
											<span>Android</span>
										</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
											<div className="h-2 w-2 rounded-full bg-orange-500" />
											<span>Apklis</span>
										</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
											<div className="h-2 w-2 rounded-full bg-blue-500" />
											<span>Cuba</span>
										</div>
									</div>

									<div className="flex justify-end items-end w-full mt-2">
										<Button asChild className="rounded-full">
											<a
												href="https://www.apklis.cu/application/cu.lazaroysr96.cnae"
												target="_blank"
												rel="noopener noreferrer"
											>
												Instalar
											</a>
										</Button>
									</div>
								</div>
							</div>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
