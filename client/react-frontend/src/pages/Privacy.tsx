import {
	AlertTriangle,
	Database,
	Lock,
	Mail,
	Shield,
	Coins,
	Sparkles,
	Server,
	MapPin,
	Building,
	FileText,
	Globe,
	Users,
	Bell,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
	const currentDate = new Date().toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<div className="flex items-center justify-center gap-2 mb-4">
						<Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
						<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
							Política de Privacidad
						</h1>
					</div>
					<Badge
						variant="outline"
						className="text-lg px-4 py-2 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
					>
						SYSGD Ecosystem - Versión 2.0 Beta
					</Badge>
					<p className="text-gray-600 dark:text-gray-400 mt-4">
						<strong>Última actualización:</strong> {currentDate}
					</p>
				</div>

				<Alert className="mb-6 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/50">
					<AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
					<AlertDescription className="text-amber-800 dark:text-amber-200">
						<strong>Aviso importante:</strong> Este sistema se encuentra en fase
						beta. Aunque implementamos controles de seguridad profesionales, 
						recomendamos no almacenar información extremadamente sensible durante esta fase.
					</AlertDescription>
				</Alert>

				<div className="space-y-6">
					{/* SECCIÓN 0: RESPONSABLE DEL TRATAMIENTO */}
					<Card className="border-2 border-green-500 dark:border-green-400 dark:bg-gray-800">
						<CardHeader className="bg-green-50 dark:bg-green-900/50">
							<CardTitle className="flex items-center gap-2">
								<Building className="h-5 w-5 text-green-600 dark:text-green-400" />
								Responsable del Tratamiento
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6">
							<div className="space-y-3 text-gray-700 dark:text-gray-300">
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<p className="font-semibold text-gray-900 dark:text-gray-100">Identidad:</p>
										<p>SYSGD Ecosystem</p>
									</div>
									<div>
										<p className="font-semibold text-gray-900 dark:text-gray-100">Desarrollador:</p>
										<p>Lazaro Yunier Salazar Rodriguez</p>
									</div>
									<div>
										<p className="font-semibold text-gray-900 dark:text-gray-100">NIF/CIF:</p>
										<p>96121719166</p>
									</div>
									<div>
										<p className="font-semibold text-gray-900 dark:text-gray-100">País:</p>
										<p>Cuba</p>
									</div>
								</div>
								<Separator className="my-4" />
								<div>
									<p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Dirección Legal:</p>
									<p>Barrio Laguna Blanca S/N, Jesús Menéndez, Las Tunas, Cuba, Código Postal 77300</p>
								</div>
								<Separator className="my-4" />
								<div className="grid md:grid-cols-3 gap-3">
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-blue-600" />
										<div>
											<p className="text-xs text-gray-500">General:</p>
											<a href="mailto:support@ecosysgd.com" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
												support@ecosysgd.com
											</a>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Shield className="h-4 w-4 text-green-600" />
										<div>
											<p className="text-xs text-gray-500">Privacidad:</p>
											<a href="mailto:privacy@ecosysgd.com" className="text-green-600 dark:text-green-400 hover:underline text-sm">
												privacy@ecosysgd.com
											</a>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Users className="h-4 w-4 text-purple-600" />
										<div>
											<p className="text-xs text-gray-500">DPO:</p>
											<a href="mailto:dpo@ecosysgd.com" className="text-purple-600 dark:text-purple-400 hover:underline text-sm">
												dpo@ecosysgd.com
											</a>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									1
								</span>
								<Database className="h-5 w-5 text-green-600 dark:text-green-400" />
								¿Qué información recopilamos?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
										1.1 Información de Cuenta
										<Badge variant="outline" className="ml-2 text-xs">
											Art. 6(1)(b) GDPR - Ejecución de contrato
										</Badge>
									</h4>
									<p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
										Al registrarte, recopilamos:
									</p>
									<ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
										<li><strong>Nombre</strong> y <strong>apellidos</strong></li>
										<li><strong>Correo electrónico</strong> (inicio de sesión y notificaciones)</li>
										<li><strong>Contraseña</strong> (hasheada con bcrypt, nunca en texto plano)</li>
										<li><strong>País de residencia</strong> (para cumplimiento legal)</li>
										<li>Fecha y hora de registro</li>
									</ul>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
										1.2 Información de Uso
										<Badge variant="outline" className="ml-2 text-xs">
											Art. 6(1)(b) GDPR
										</Badge>
									</h4>
									<ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
										<li>Documentos y archivos subidos</li>
										<li>Proyectos, tareas y contenido creado</li>
										<li>Prompts y solicitudes a servicios de IA</li>
										<li>Historial de consumo de créditos</li>
									</ul>
								</div>

								<div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
									<h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
										<MapPin className="h-5 w-5" />
										1.2.1 SYSGD CONT (Gestor Contable TCP - Solo Cuba)
									</h4>
									<p className="text-blue-800 dark:text-blue-300 text-sm mb-2">
										Para usuarios de la app de contabilidad, además recopilamos:
									</p>
									<ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-300 ml-4 text-sm">
										<li><strong>NIT</strong> (Número de Identificación Tributaria)</li>
										<li><strong>Actividad económica</strong> registrada ante ONAT</li>
										<li><strong>Domicilios</strong> fiscal y legal</li>
										<li><strong>Registros contables:</strong> ingresos, gastos, tributos pagados</li>
										<li><strong>Datos para Declaración Jurada</strong> (DJ-08)</li>
									</ul>
									<div className="mt-3 bg-blue-100 dark:bg-blue-800/50 rounded p-2">
										<p className="text-blue-900 dark:text-blue-200 text-xs font-semibold">
											🇨🇺 Base legal (Cuba): Ley 149/2022 Art. 11 - Consentimiento explícito
										</p>
										<p className="text-blue-900 dark:text-blue-200 text-xs">
											Finalidad: Registro contable digital para cumplimiento ante ONAT
										</p>
									</div>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
										1.3 Información de Pagos
										<Badge variant="outline" className="ml-2 text-xs">
											Art. 6(1)(c) GDPR - Obligación legal
										</Badge>
									</h4>
									<ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
										<li><strong>Dirección de wallet</strong> de criptomonedas</li>
										<li>Hash de transacciones blockchain</li>
										<li>Historial de compras de créditos</li>
										<li><strong>Facturas</strong> (conservadas 7 años por obligación fiscal)</li>
										<li><strong>NO almacenamos claves privadas ni seed phrases</strong></li>
									</ul>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
										1.4 Datos Técnicos
										<Badge variant="outline" className="ml-2 text-xs">
											Art. 6(1)(f) GDPR - Interés legítimo
										</Badge>
									</h4>
									<ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
										<li>Dirección IP (seguridad y geo-blocking)</li>
										<li>Tipo de navegador y sistema operativo</li>
										<li>Información de dispositivo</li>
										<li>Logs de acceso (90 días)</li>
										<li>Cookies de sesión</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 2: BASE LEGAL */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									2
								</span>
								<FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
								Base Legal y Finalidad del Tratamiento
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b dark:border-gray-700">
											<th className="text-left p-2 font-semibold">Dato</th>
											<th className="text-left p-2 font-semibold">Finalidad</th>
											<th className="text-left p-2 font-semibold">Base Legal (GDPR Art. 6)</th>
										</tr>
									</thead>
									<tbody className="text-gray-700 dark:text-gray-300">
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Email + Contraseña</td>
											<td className="p-2">Autenticación</td>
											<td className="p-2">(b) Ejecución de contrato</td>
										</tr>
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Nombre</td>
											<td className="p-2">Personalización del servicio</td>
											<td className="p-2">(b) Ejecución de contrato</td>
										</tr>
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Documentos subidos</td>
											<td className="p-2">Almacenamiento cloud</td>
											<td className="p-2">(b) Ejecución de contrato</td>
										</tr>
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Prompts de IA</td>
											<td className="p-2">Procesamiento de solicitudes</td>
											<td className="p-2">(b) Ejecución de contrato</td>
										</tr>
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Dirección IP</td>
											<td className="p-2">Seguridad y geo-blocking</td>
											<td className="p-2">(f) Interés legítimo</td>
										</tr>
										<tr className="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/30">
											<td className="p-2 font-semibold">Datos fiscales (SYSGD CONT)</td>
											<td className="p-2">Registro contable TCP</td>
											<td className="p-2">(b) Ejecución de contrato</td>
										</tr>
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Datos de transacciones</td>
											<td className="p-2">Facturación legal</td>
											<td className="p-2">(c) Obligación legal</td>
										</tr>
										<tr>
											<td className="p-2">Cookies analytics</td>
											<td className="p-2">Mejora del servicio</td>
											<td className="p-2">(a) Consentimiento</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mt-4">
								<p className="text-blue-800 dark:text-blue-300 text-sm font-semibold">
									📌 NO compartimos tu información con terceros para fines comerciales o publicitarios
								</p>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 3: SEGURIDAD */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									3
								</span>
								<Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
								Seguridad de Tus Datos (Art. 32 GDPR)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
									<strong>Medidas Técnicas implementadas:</strong>
								</p>
								
								<div className="grid md:grid-cols-2 gap-3">
									<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
										<h5 className="font-semibold text-green-900 dark:text-green-300 mb-1">✓ Encriptación en reposo</h5>
										<p className="text-sm text-green-800 dark:text-green-400">AES-256-GCM para datos sensibles</p>
									</div>
									<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
										<h5 className="font-semibold text-green-900 dark:text-green-300 mb-1">✓ Encriptación en tránsito</h5>
										<p className="text-sm text-green-800 dark:text-green-400">TLS 1.3 para todas las conexiones</p>
									</div>
									<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
										<h5 className="font-semibold text-green-900 dark:text-green-300 mb-1">✓ Hashing de contraseñas</h5>
										<p className="text-sm text-green-800 dark:text-green-400">bcrypt con salt único</p>
									</div>
									<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
										<h5 className="font-semibold text-green-900 dark:text-green-300 mb-1">✓ Row Level Security</h5>
										<p className="text-sm text-green-800 dark:text-green-400">Solo ves tus propios datos</p>
									</div>
									<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
										<h5 className="font-semibold text-green-900 dark:text-green-300 mb-1">✓ Backups cifrados</h5>
										<p className="text-sm text-green-800 dark:text-green-400">Diarios, con retención de 30 días</p>
									</div>
									<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
										<h5 className="font-semibold text-green-900 dark:text-green-300 mb-1">✓ Geo-blocking (SYSGD CONT)</h5>
										<p className="text-sm text-green-800 dark:text-green-400">Acceso restringido a Cuba por IP</p>
									</div>
								</div>

								<p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
									<strong>Medidas Organizativas:</strong>
								</p>
								<ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
									<li>Acceso mínimo necesario (principio de privilegio mínimo)</li>
									<li>Auditoría de todos los accesos administrativos</li>
									<li>Procedimiento de respuesta a incidentes</li>
									<li>Revisiones de seguridad trimestrales</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 4: CON QUIÉN COMPARTIMOS */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									4
								</span>
								<Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
								¿Con quién compartimos tus datos?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.1 Acceso Interno (Art. 45 Ley 149/2022)</h4>
									<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
										<li>Solo personal autorizado tiene acceso técnico</li>
										<li>Acceso únicamente para: mantenimiento, soporte técnico, mejoras</li>
										<li><strong>Todo acceso es registrado</strong> en logs de auditoría</li>
										<li>Personal obligado a confidencialidad</li>
									</ul>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.2 Servicios de Terceros (Art. 44-50 GDPR)</h4>
									<div className="overflow-x-auto">
										<table className="w-full text-sm mt-2">
											<thead>
												<tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
													<th className="text-left p-2">Proveedor</th>
													<th className="text-left p-2">Ubicación</th>
													<th className="text-left p-2">Datos compartidos</th>
													<th className="text-left p-2">Salvaguarda Legal</th>
												</tr>
											</thead>
											<tbody className="text-gray-700 dark:text-gray-300">
												<tr className="border-b dark:border-gray-700">
													<td className="p-2 font-medium">Google Gemini</td>
													<td className="p-2">USA</td>
													<td className="p-2">Prompts de IA</td>
													<td className="p-2">Standard Contractual Clauses (SCC)</td>
												</tr>
												<tr className="border-b dark:border-gray-700">
													<td className="p-2 font-medium">Supabase</td>
													<td className="p-2">[Especificar región]</td>
													<td className="p-2">Todos los datos de cuenta</td>
													<td className="p-2">SCC + Certificación SOC 2</td>
												</tr>
												<tr className="border-b dark:border-gray-700">
													<td className="p-2 font-medium">Vercel</td>
													<td className="p-2">USA</td>
													<td className="p-2">Datos técnicos</td>
													<td className="p-2">SCC</td>
												</tr>
												<tr>
													<td className="p-2 font-medium">Blockchain pública</td>
													<td className="p-2">Descentralizado</td>
													<td className="p-2">Wallet + transacciones</td>
													<td className="p-2">No aplica (datos públicos)</td>
												</tr>
											</tbody>
										</table>
									</div>
									<p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
										Puedes solicitar copia de los DPAs (Data Processing Agreements) a: privacy@ecosysgd.com
									</p>
								</div>

								<div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-3">
									<p className="text-red-800 dark:text-red-300 text-sm font-semibold">
										❌ NO Compartimos Con Terceros Para:
									</p>
									<ul className="list-disc list-inside text-red-800 dark:text-red-300 text-sm ml-4 mt-1">
										<li>Marketing no solicitado</li>
										<li>Publicidad dirigida</li>
										<li>Venta o alquiler de datos</li>
										<li>Perfilado comercial</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* [CONTINÚA EN SIGUIENTE PARTE...] */}
					{/* Las secciones 5-12 siguen el mismo patrón con las mejoras */}

					{/* SECCIÓN 5: IA */}
					<Card className="border-2 border-purple-500 dark:border-purple-400 dark:bg-gray-800">
						<CardHeader className="bg-purple-50 dark:bg-purple-900/50">
							<CardTitle className="flex items-center gap-2">
								<span className="bg-purple-600 dark:bg-purple-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									5
								</span>
								<Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
								Privacidad y Servicios de IA
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6">
							<div className="space-y-3">
								<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
									Cuando usas servicios de IA en SYSGD:
								</p>
								<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
									<li>Tus prompts son enviados a proveedores de IA (Google Gemini)</li>
									<li>Los proveedores procesan tu contenido según sus propias <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">políticas de privacidad</a></li>
									<li>No tenemos control sobre cómo los proveedores usan los datos para entrenamiento</li>
									<li>El contenido generado se almacena en tu cuenta SYSGD</li>
								</ul>
								<div className="bg-purple-50 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-700 rounded-lg p-3 mt-3">
									<p className="text-purple-800 dark:text-purple-300 text-sm font-semibold">
										⚠️ Recomendación: NO incluyas información personal sensible en prompts de IA
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 6: BLOCKCHAIN */}
					<Card className="border-2 border-blue-500 dark:border-blue-400 dark:bg-gray-800">
						<CardHeader className="bg-blue-50 dark:bg-blue-900/50">
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-600 dark:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									6
								</span>
								<Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								Privacidad en Transacciones Blockchain
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6">
							<div className="space-y-3">
								<p className="text-gray-700 dark:text-gray-300 font-semibold">
									Aspectos importantes sobre privacidad en pagos con criptomonedas:
								</p>
								<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
									<li><strong>Las transacciones blockchain son públicas</strong> y visibles en exploradores de bloques</li>
									<li>Asociamos tu dirección de wallet con tu cuenta SYSGD internamente</li>
									<li>El historial de transacciones se mantiene para reconciliación y soporte</li>
									<li><strong>NUNCA solicitamos ni almacenamos claves privadas</strong></li>
									<li>Las transacciones son pseudónimas (vinculadas a wallet, no directamente a identidad)</li>
								</ul>
								<div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 rounded-lg p-3 mt-3">
									<p className="text-blue-800 dark:text-blue-300 text-sm">
										💡 Mayor privacidad: Considera usar una wallet diferente para cada transacción
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 7: RETENCIÓN DE DATOS */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									7
								</span>
								<Server className="h-5 w-5 text-green-600 dark:text-green-400" />
								Plazo de Conservación (Art. 5(1)(e) GDPR / Art. 39 Ley 149)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
											<th className="text-left p-2">Tipo de Dato</th>
											<th className="text-left p-2">Plazo</th>
											<th className="text-left p-2">Justificación</th>
										</tr>
									</thead>
									<tbody className="text-gray-700 dark:text-gray-300">
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Datos de cuenta</td>
											<td className="p-2">Mientras cuenta activa</td>
											<td className="p-2">Prestación del servicio</td>
										</tr>
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Documentos subidos</td>
											<td className="p-2">Mientras cuenta activa</td>
											<td className="p-2">Prestación del servicio</td>
										</tr>
										<tr className="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/30">
											<td className="p-2 font-semibold">Datos fiscales (SYSGD CONT)</td>
											<td className="p-2 font-semibold">5 años tras eliminación</td>
											<td className="p-2">Obligación legal ONAT (Cuba)</td>
										</tr>
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Logs de acceso</td>
											<td className="p-2">90 días</td>
											<td className="p-2">Seguridad e investigación</td>
										</tr>
										<tr className="border-b dark:border-gray-700">
											<td className="p-2">Facturas</td>
											<td className="p-2">7 años tras emisión</td>
											<td className="p-2">Obligación fiscal</td>
										</tr>
										<tr>
											<td className="p-2">Datos anonimizados</td>
											<td className="p-2">Indefinido</td>
											<td className="p-2">No es información personal</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mt-4">
								<p className="text-yellow-800 dark:text-yellow-300 text-sm">
									<strong>Al eliminar tu cuenta:</strong><br/>
									• Datos personales: Eliminados en 30 días<br/>
									• Facturas: Conservadas 7 años (obligación legal)<br/>
									• Datos SYSGD CONT: Conservados 5 años (requisito ONAT)<br/>
									• Transacciones blockchain: Permanecen en blockchain (irreversible)
								</p>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 8: TUS DERECHOS GDPR */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									8
								</span>
								<Users className="h-5 w-5 text-green-600 dark:text-green-400" />
								Tus Derechos (Art. 15-22 GDPR / Art. 19-23 Ley 149)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="grid md:grid-cols-2 gap-3">
									<div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border dark:border-gray-700">
										<h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">✓ Acceso (Art. 15/20)</h5>
										<p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
											Solicitar copia de TODOS tus datos en formato JSON
										</p>
										<p className="text-xs text-blue-600 dark:text-blue-400">
											Cómo: Configuración → Privacidad → Exportar Datos
										</p>
									</div>
									<div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border dark:border-gray-700">
										<h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">✓ Rectificación (Art. 16/21)</h5>
										<p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
											Corregir datos incorrectos o incompletos
										</p>
										<p className="text-xs text-blue-600 dark:text-blue-400">
											Cómo: Configuración → Cuenta → Editar Perfil
										</p>
									</div>
									<div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border dark:border-gray-700">
										<h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">✓ Supresión / "Derecho al olvido" (Art. 17/22)</h5>
										<p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
											Eliminar tus datos cuando ya no sean necesarios
										</p>
										<p className="text-xs text-red-600 dark:text-red-400 mb-1">
											Excepciones: Facturas (7 años), datos SYSGD CONT (5 años)
										</p>
										<p className="text-xs text-blue-600 dark:text-blue-400">
											Cómo: Configuración → Eliminar Cuenta
										</p>
									</div>
									<div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border dark:border-gray-700">
										<h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">✓ Portabilidad (Art. 20)</h5>
										<p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
											Recibir tus datos en formato JSON estructurado
										</p>
										<p className="text-xs text-blue-600 dark:text-blue-400">
											Cómo: Configuración → Exportar Datos
										</p>
									</div>
									<div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border dark:border-gray-700">
										<h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">✓ Restricción (Art. 18)</h5>
										<p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
											Suspender el tratamiento temporalmente
										</p>
										<p className="text-xs text-blue-600 dark:text-blue-400">
											Cómo: Escribe a privacy@ecosysgd.com
										</p>
									</div>
									<div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border dark:border-gray-700">
										<h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">✓ Oposición (Art. 21/23)</h5>
										<p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
											Oponerte al tratamiento basado en interés legítimo
										</p>
										<p className="text-xs text-blue-600 dark:text-blue-400">
											Cómo: Escribe a privacy@ecosysgd.com
										</p>
									</div>
								</div>
								<div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
									<p className="text-blue-800 dark:text-blue-300 text-sm">
										<strong>Plazo de respuesta:</strong> Máximo 30 días (Art. 12(3) GDPR)
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 9: MENORES DE EDAD */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									9
								</span>
								<AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
								Menores de Edad (Art. 8 GDPR)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
									<p className="text-amber-900 dark:text-amber-300 font-semibold mb-2">
										Edad mínima para crear cuenta:
									</p>
									<ul className="list-disc list-inside text-amber-800 dark:text-amber-300 ml-4">
										<li><strong>Europa (UE/EEA):</strong> 16 años</li>
										<li><strong>Resto del mundo:</strong> 18 años</li>
									</ul>
								</div>
								<p className="text-gray-700 dark:text-gray-300">
									Si eres menor, necesitas <strong>consentimiento verificable de tu padre/madre/tutor legal</strong>.
								</p>
								<p className="text-gray-700 dark:text-gray-300">
									Si descubrimos que un menor ha creado una cuenta sin consentimiento, 
									la eliminaremos inmediatamente.
								</p>
								<p className="text-gray-700 dark:text-gray-300 text-sm">
									<strong>Padres/tutores:</strong> Si crees que tu hijo creó una cuenta, contacta: 
									<a href="mailto:privacy@ecosysgd.com" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
										privacy@ecosysgd.com
									</a>
								</p>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 10: NOTIFICACIÓN DE BRECHAS */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									10
								</span>
								<Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
								Notificación de Brechas de Seguridad (Art. 33-34 GDPR / Art. 48 Ley 149)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 dark:text-gray-300">
									En caso de brecha de seguridad que afecte tus datos:
								</p>
								<div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-3">
									<p className="text-red-900 dark:text-red-300 font-semibold mb-2">Nuestras obligaciones:</p>
									<ul className="list-disc list-inside text-red-800 dark:text-red-300 ml-4 space-y-1">
										<li>Notificar a la autoridad de control en <strong>72 horas</strong></li>
										<li>Notificarte a ti si hay <strong>alto riesgo</strong> para tus derechos</li>
										<li>Documentar el incidente completo</li>
									</ul>
								</div>
								<p className="text-gray-700 dark:text-gray-300 text-sm">
									<strong>Qué te diremos:</strong>
								</p>
								<ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 text-sm">
									<li>Naturaleza de la brecha</li>
									<li>Datos potencialmente afectados</li>
									<li>Medidas tomadas para mitigarla</li>
									<li>Recomendaciones para protegerte</li>
								</ul>
								<p className="text-gray-700 dark:text-gray-300 text-sm">
									<strong>Contacto para reportar brechas:</strong> 
									<a href="mailto:security@ecosysgd.com" className="text-red-600 dark:text-red-400 hover:underline ml-1">
										security@ecosysgd.com
									</a> (respuesta en {'<'}24h)
								</p>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 11: COOKIES */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									11
								</span>
								Cookies y Tecnologías Similares
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div>
									<h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
										Cookies Estrictamente Necesarias (NO requieren consentimiento)
									</h5>
									<ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4">
										<li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">auth-token</code>: Mantener sesión activa</li>
										<li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">theme</code>: Recordar tema oscuro/claro</li>
									</ul>
								</div>
								<div>
									<h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
										Cookies de Analytics (REQUIEREN consentimiento)
									</h5>
									<ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4">
										<li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">_ga</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">_gid</code>: Google Analytics</li>
									</ul>
								</div>
								<p className="text-gray-700 dark:text-gray-300 text-sm">
									<strong>Control:</strong> Puedes cambiar tus preferencias en: Configuración → Privacidad → Cookies
								</p>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 12: AUTORIDAD DE CONTROL */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									12
								</span>
								<Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
								Autoridad de Control y Reclamaciones (Art. 77 GDPR)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 dark:text-gray-300">
									Tienes derecho a presentar reclamación ante tu autoridad nacional de protección de datos:
								</p>
								<div className="grid md:grid-cols-2 gap-3">
									<div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
										<p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">🇪🇺 Europa (UE/EEA):</p>
										<ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
											<li>• España: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="underline">AEPD</a></li>
											<li>• Alemania: <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="underline">BfDI</a></li>
											<li>• <a href="https://edpb.europa.eu/about-edpb/board/members_en" target="_blank" rel="noopener noreferrer" className="underline">Lista completa</a></li>
										</ul>
									</div>
									<div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-lg p-3">
										<p className="font-semibold text-green-900 dark:text-green-300 mb-1">🌎 Otros países:</p>
										<ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
											<li>• USA (California): California Attorney General</li>
											<li>• Brasil: <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="underline">ANPD</a></li>
											<li>• Reino Unido: <a href="https://www.ico.org.uk" target="_blank" rel="noopener noreferrer" className="underline">ICO</a></li>
											<li>• Cuba: Ministerio de Comunicaciones (MINCOM)</li>
										</ul>
									</div>
								</div>
								<div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
									<p className="text-yellow-800 dark:text-yellow-300 text-sm">
										<strong>Preferimos resolver amigablemente:</strong><br/>
										Antes de acudir a la autoridad, por favor contacta: 
										<a href="mailto:privacy@ecosysgd.com" className="underline ml-1">privacy@ecosysgd.com</a>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 13: CONTACTO */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									13
								</span>
								Contacto
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 dark:text-gray-300 mb-4">
								Para preguntas, solicitudes o reportes sobre privacidad:
							</p>
							<div className="grid md:grid-cols-2 gap-3">
								<div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
									<p className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📧 Preguntas sobre Privacidad:</p>
									<p className="text-sm text-blue-800 dark:text-blue-300 mb-1">
										<a href="mailto:privacy@ecosysgd.com" className="underline">privacy@ecosysgd.com</a>
									</p>
									<p className="text-xs text-blue-700 dark:text-blue-400">Plazo de respuesta: 48 horas (días laborables)</p>
								</div>
								<div className="bg-purple-50 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
									<p className="font-semibold text-purple-900 dark:text-purple-300 mb-2">👤 Data Protection Officer (DPO):</p>
									<p className="text-sm text-purple-800 dark:text-purple-300 mb-1">
										<a href="mailto:dpo@ecosysgd.com" className="underline">dpo@ecosysgd.com</a>
									</p>
									<p className="text-xs text-purple-700 dark:text-purple-400">Supervisión del cumplimiento de GDPR</p>
								</div>
								<div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-lg p-3">
									<p className="font-semibold text-green-900 dark:text-green-300 mb-2">💬 Soporte General:</p>
									<p className="text-sm text-green-800 dark:text-green-300 mb-1">
										<a href="mailto:support@ecosysgd.com" className="underline">support@ecosysgd.com</a>
									</p>
									<p className="text-xs text-green-700 dark:text-green-400">Para cuestiones técnicas</p>
								</div>
								<div className="bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3">
									<p className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2">📱 WhatsApp:</p>
									<p className="text-sm text-emerald-800 dark:text-emerald-300">
										<a href="https://wa.me/5351158544" className="underline">+53 5115 8544</a>
									</p>
									<p className="text-xs text-emerald-700 dark:text-emerald-400">Lunes a viernes, 9am - 6pm</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Separator className="my-8 dark:bg-gray-700" />

				<Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 border-green-200 dark:border-green-700">
					<CardContent className="pt-6 text-center">
						<div className="flex items-center justify-center gap-2 mb-3">
							<Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
							<h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
								Tu privacidad es importante
							</h3>
						</div>
						<p className="text-green-700 dark:text-green-300 mb-2">
							Trabajamos continuamente para mejorar la seguridad y protección de
							tus datos en SYSGD Ecosystem.
						</p>
						<p className="text-green-600 dark:text-green-400 text-sm">
							Si tienes dudas sobre cómo manejamos tu información, no dudes en contactarnos.
						</p>
					</CardContent>
				</Card>

				<div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-500">
					<p>© 2024-2026 SYSGD Ecosystem</p>
					<p className="text-xs mt-1">Versión 2.0 Beta - Cumplimiento GDPR + Ley 149/2022 Cuba</p>
				</div>
			</div>
		</div>
	);
}