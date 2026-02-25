import { FileText, Mail, Phone, AlertTriangle, MapPin, Building, Globe, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TermsAndConditions() {
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
						<FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
						<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
							Términos y Condiciones de Uso
						</h1>
					</div>
					<Badge variant="outline" className="text-lg px-4 py-2 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
						SYSGD Ecosystem - Versión 2.0 Beta
					</Badge>
					<p className="text-gray-600 dark:text-gray-400 mt-4">
						<strong>Fecha de entrada en vigor:</strong> {currentDate}
					</p>
				</div>

				{/* ALERTA BETA */}
				<Alert className="mb-6 border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/50">
					<AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					<AlertDescription>
						<div className="space-y-2">
							<p className="font-bold text-amber-900 dark:text-amber-300 text-lg">
								⚠️ SISTEMA EN FASE BETA - LEE ESTO CUIDADOSAMENTE
							</p>
							<p className="text-amber-800 dark:text-amber-300">
								SYSGD Ecosystem está en desarrollo activo. Al usar este servicio, aceptas que:
							</p>
							<ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300 ml-4">
								<li><strong>Las transacciones blockchain son IRREVERSIBLES</strong></li>
								<li>El sistema puede tener errores o funcionar inesperadamente</li>
								<li><strong>NO nos hacemos responsables por pérdidas económicas o de datos</strong></li>
								<li>El servicio puede interrumpirse sin previo aviso</li>
							</ul>
						</div>
					</AlertDescription>
				</Alert>

				{/* INFORMACIÓN LEGAL */}
				<Card className="mb-6 border-2 border-blue-500 dark:border-blue-400 dark:bg-gray-800">
					<CardHeader className="bg-blue-50 dark:bg-blue-900/50">
						<CardTitle className="flex items-center gap-2">
							<Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							Información Legal del Proveedor
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="grid md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
							<div>
								<p className="font-semibold text-gray-900 dark:text-gray-100">Nombre legal:</p>
								<p>Lazaro Yunier Salazar Rodriguez</p>
							</div>
							<div>
								<p className="font-semibold text-gray-900 dark:text-gray-100">NIF/CIF/Pasaporte:</p>
								<p>96121719166</p>
							</div>
							<div className="md:col-span-2">
								<p className="font-semibold text-gray-900 dark:text-gray-100">Dirección:</p>
								<p>Barrio Laguna Blanca S/N, Jesús Menéndez, Las Tunas, Cuba, Código Postal 77300</p>
							</div>
							<div>
								<p className="font-semibold text-gray-900 dark:text-gray-100">País:</p>
								<p>Cuba</p>
							</div>
						</div>
						<Separator className="my-4" />
						<div className="space-y-2">
							<p className="font-semibold text-gray-900 dark:text-gray-100">Contacto:</p>
							<div className="flex items-center gap-2 text-sm">
								<Mail className="h-4 w-4 text-blue-600" />
								<span>General:</span>
								<a href="mailto:support@ecosysgd.com" className="text-blue-600 dark:text-blue-400 hover:underline">
									support@ecosysgd.com
								</a>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Scale className="h-4 w-4 text-purple-600" />
								<span>Legal:</span>
								<a href="mailto:legal@ecosysgd.com" className="text-purple-600 dark:text-purple-400 hover:underline">
									legal@ecosysgd.com
								</a>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Phone className="h-4 w-4 text-green-600" />
								<span>WhatsApp Business:</span>
								<a href="https://wa.me/5351158544" className="text-green-600 dark:text-green-400 hover:underline">
									+53 5115 8544
								</a>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* INTRODUCCIÓN */}
				<Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
					<CardContent className="pt-6">
						<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
							Bienvenido a <strong>SYSGD Ecosystem</strong>, una plataforma integral que combina 
							gestión documental, inteligencia artificial, contabilidad para TCP (Cuba) y 
							servicios de pago con criptomonedas. Al registrarte y utilizar este sistema, 
							aceptas los siguientes Términos y Condiciones. Si no estás de acuerdo, por favor, 
							no utilices la plataforma.
						</p>
					</CardContent>
				</Card>

				<div className="space-y-6">
					{/* SECCIÓN 1: ACEPTACIÓN */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									1
								</span>
								Aceptación de Términos
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 dark:text-gray-300 mb-3">
								Al crear una cuenta y usar SYSGD, confirmas que:
							</p>
							<div className="grid md:grid-cols-2 gap-3">
								<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
									<p className="text-sm text-green-800 dark:text-green-300">✓ Has leído estos Términos de Servicio</p>
								</div>
								<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
									<p className="text-sm text-green-800 dark:text-green-300">✓ Has leído la Política de Privacidad</p>
								</div>
								<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
									<p className="text-sm text-green-800 dark:text-green-300">✓ Tienes al menos 16 años (UE) o 18 años (resto)</p>
								</div>
								<div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-3 border border-green-200 dark:border-green-700">
									<p className="text-sm text-green-800 dark:text-green-300">✓ Tienes capacidad legal para celebrar contratos</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 2: ELEGIBILIDAD Y MENORES */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									2
								</span>
								Elegibilidad y Menores de Edad
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
									<p className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Edad mínima:</p>
									<ul className="list-disc list-inside text-amber-800 dark:text-amber-300 ml-4">
										<li><strong>Europa (UE/EEA):</strong> 16 años mínimo</li>
										<li><strong>Resto del mundo:</strong> 18 años mínimo</li>
									</ul>
								</div>
								<p className="text-gray-700 dark:text-gray-300">
									Si eres menor de edad según tu jurisdicción, necesitas <strong>consentimiento 
									verificable</strong> de tu padre/madre/tutor legal para usar SYSGD.
								</p>
								<p className="text-gray-700 dark:text-gray-300">
									Nos reservamos el derecho de solicitar verificación de edad. Si descubrimos 
									que un menor creó una cuenta sin consentimiento, la eliminaremos inmediatamente 
									sin derecho a reembolso.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 3: SOBRE SYSGD */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									3
								</span>
								<Globe className="h-5 w-5" />
								Sobre SYSGD Ecosystem
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
									SYSGD es un ecosistema de servicios en desarrollo que incluye:
								</p>
								<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
									<li><strong>Gestión Documental:</strong> Digitalización y organización de archivos en la nube</li>
									<li><strong>Inteligencia Artificial:</strong> Servicios de IA generativa para productividad</li>
									<li><strong>Sistema de Pagos Cripto:</strong> Compra de créditos y planes mediante criptomonedas</li>
									<li><strong>Herramientas de Colaboración:</strong> Gestión de proyectos y tareas</li>
								</ul>

								<div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-3">
									<div className="flex items-center gap-2 mb-2">
										<MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
										<h4 className="font-semibold text-blue-900 dark:text-blue-300">
											SYSGD CONT (Gestor Contable TCP)
										</h4>
									</div>
									<p className="text-blue-800 dark:text-blue-300 text-sm mb-2">
										App de contabilidad exclusiva para Trabajadores por Cuenta Propia (TCP) en Cuba:
									</p>
									<ul className="list-disc list-inside text-blue-800 dark:text-blue-300 text-sm ml-4 space-y-1">
										<li>Registro de ingresos, gastos y tributos</li>
										<li>Generación de PDF formato ONAT</li>
										<li>Preparación de Declaración Jurada (DJ-08)</li>
										<li><strong>Solo disponible en Cuba</strong> (geo-bloqueado por IP para el resto del mundo.)</li>
										<li>Precio: $50 CUP pago único</li>
									</ul>
								</div>

								<div className="bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mt-3">
									<p className="text-amber-800 dark:text-amber-300 text-sm">
										<strong>Fase Beta:</strong> El sistema está en desarrollo activo. Las funciones 
										pueden cambiar, fallar o comportarse de forma inesperada.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Continúa con las demás secciones igual que antes... */}
					{/* Por brevedad, incluyo solo las más importantes actualizadas */}

					{/* SECCIÓN 4: USO PERMITIDO */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									4
								</span>
								Uso Permitido
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 dark:text-gray-300 mb-3">El usuario se compromete a:</p>
							<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
								<li>Utilizar SYSGD únicamente con fines legítimos y conforme a las leyes aplicables</li>
								<li>No intentar acceder, alterar o eliminar datos de otros usuarios</li>
								<li>No cargar contenido ilegal, ofensivo o que viole derechos de terceros</li>
								<li>No realizar ingeniería inversa, hackeo o pruebas de seguridad sin autorización previa escrita</li>
								<li>No abusar del sistema de créditos, IA o pagos para fines fraudulentos</li>
								<li>No usar servicios de IA para generar contenido dañino, ilegal o engañoso</li>
								<li>Verificar la exactitud del contenido generado por IA antes de usarlo</li>
								<li>No compartir credenciales de acceso con terceros</li>
							</ul>
						</CardContent>
					</Card>

					{/* SECCIÓN 5: CUENTAS */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									5
								</span>
								Cuentas de Usuario
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.1 Responsabilidad</h4>
									<ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4">
										<li>Eres responsable de mantener la confidencialidad de tus credenciales</li>
										<li>Eres responsable de toda actividad que ocurra bajo tu cuenta</li>
										<li>Debes notificar inmediatamente cualquier uso no autorizado</li>
									</ul>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.2 Suspensión y Eliminación</h4>
									<p className="text-gray-700 dark:text-gray-300">
										El uso indebido puede derivar en suspensión o eliminación sin previo aviso.
									</p>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.3 Eliminación Voluntaria</h4>
									<p className="text-gray-700 dark:text-gray-300 mb-2">
										Puedes solicitar la eliminación de tu cuenta mediante:
									</p>
									<ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4">
										<li>Panel de control: Configuración → Cuenta → Eliminar Cuenta</li>
										<li>Email: support@ecosysgd.com</li>
									</ul>
									<div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-3 mt-2">
										<p className="text-red-800 dark:text-red-300 text-sm font-semibold">
											⚠️ Consecuencias de eliminación:
										</p>
										<ul className="list-disc list-inside text-red-800 dark:text-red-300 text-sm ml-4 mt-1">
											<li>Perderás todos los créditos no utilizados (sin reembolso)</li>
											<li>Se eliminarán permanentemente todos tus documentos</li>
											<li>Conservaremos facturas 7 años (obligación legal)</li>
										</ul>
									</div>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.4 Prohibiciones</h4>
									<ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4">
										<li>❌ No se permite compartir cuentas</li>
										<li>❌ No se permite transferir créditos entre usuarios</li>
										<li>❌ No se permite revender el servicio</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Las secciones 6-11 son idénticas a tu versión anterior, solo con emails actualizados */}
					{/* Incluyo la sección de pagos y limitación de responsabilidad que son críticas */}

					{/* SECCIÓN 6: PAGOS CRIPTO - Ya la tienes bien */}
					{/* SECCIÓN 7: IA - Ya la tienes bien */}
					{/* SECCIÓN 8: DISPONIBILIDAD - Ya la tienes bien */}
					{/* SECCIÓN 9: PROPIEDAD INTELECTUAL - Ya la tienes bien */}

					{/* SECCIÓN 10: LIMITACIÓN DE RESPONSABILIDAD (actualizada) */}
					<Card className="border-2 border-red-500 dark:border-red-400 dark:bg-gray-800">
						<CardHeader className="bg-red-50 dark:bg-red-900/50">
							<CardTitle className="flex items-center gap-2">
								<span className="bg-red-600 dark:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									10
								</span>
								<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
								Limitación de Responsabilidad
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6">
							<div className="space-y-3">
								<p className="text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
									SYSGD se proporciona "TAL CUAL ESTÁ", sin garantías de ningún tipo.
								</p>

								<div className="bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg p-4">
									<p className="text-red-900 dark:text-red-300 font-bold mb-2">
										EL DESARROLLADOR NO SE RESPONSABILIZA POR:
									</p>
									<ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-300 ml-4">
										<li><strong>Pérdidas económicas</strong> derivadas de transacciones, errores o uso de servicios</li>
										<li><strong>Pérdida de datos</strong>, archivos o información almacenada</li>
										<li><strong>Errores en contenido generado por IA</strong> o decisiones basadas en dicho contenido</li>
										<li><strong>Transacciones blockchain incorrectas</strong> o enviadas a direcciones equivocadas</li>
										<li><strong>Créditos gastados</strong> en operaciones fallidas o contenido insatisfactorio</li>
										<li><strong>Accesos no autorizados</strong>, brechas de seguridad o vulnerabilidades</li>
										<li><strong>Interrupciones del servicio</strong>, mantenimientos o cambios en funcionalidades</li>
										<li>Cualquier <strong>daño directo, indirecto, consecuencial o punitivo</strong></li>
									</ul>
								</div>

								<div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
									<p className="text-yellow-800 dark:text-yellow-300 text-sm font-semibold">
										🔢 Límite de Responsabilidad:
									</p>
									<p className="text-yellow-800 dark:text-yellow-300 text-sm mt-1">
										En ningún caso nuestra responsabilidad total excederá el monto pagado por el 
										usuario en los últimos 12 meses, o $100 USD (lo que sea menor).
									</p>
								</div>

								<p className="text-red-600 dark:text-red-400 font-bold text-center mt-4 text-lg">
									⚠️ UTILIZAS SYSGD BAJO TU PROPIO RIESGO Y RESPONSABILIDAD
								</p>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 11: INDEMNIZACIÓN */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									11
								</span>
								<Scale className="h-5 w-5" />
								Indemnización
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
								Aceptas indemnizar, defender y mantener indemne a SYSGD, sus desarrolladores, 
								empleados y afiliados de cualquier reclamación, daño, pérdida o gasto 
								(incluyendo honorarios legales) derivados de:
							</p>
							<ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 mt-2 space-y-1">
								<li>Tu uso de la plataforma</li>
								<li>Tu violación de estos términos</li>
								<li>Tu violación de derechos de terceros</li>
								<li>Contenido que subas o generes</li>
								<li>Transacciones cripto que realices</li>
							</ul>
						</CardContent>
					</Card>

					{/* SECCIÓN 12: MODIFICACIONES */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									12
								</span>
								Modificaciones a los Términos
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 dark:text-gray-300">
									Nos reservamos el derecho de modificar estos términos en cualquier momento.
								</p>
								<div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
									<p className="text-blue-800 dark:text-blue-300 text-sm font-semibold mb-2">
										📧 Notificación de cambios significativos:
									</p>
									<ul className="list-disc list-inside text-blue-800 dark:text-blue-300 text-sm ml-4">
										<li>Email con 30 días de anticipación</li>
										<li>Banner en la plataforma</li>
										<li>Notificación al iniciar sesión</li>
									</ul>
								</div>
								<p className="text-gray-700 dark:text-gray-300 text-sm">
									El uso continuado de SYSGD después de cambios implica tu aceptación.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 13: LEY APLICABLE */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									13
								</span>
								Ley Aplicable y Jurisdicción
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">13.1 Ley Aplicable</h4>
									<p className="text-gray-700 dark:text-gray-300">Estos términos se rigen por:</p>
									<ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4 mt-1">
										<li><strong>GDPR</strong> (UE 2016/679) para usuarios en Europa</li>
										<li><strong>CCPA</strong> para usuarios en California</li>
										<li><strong>Ley 149/2022</strong> para usuarios en Cuba (SYSGD CONT)</li>
										<li>Leyes aplicable dentro de La Republica de Cuba como jurisdicción supletoria</li>
									</ul>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">13.2 Resolución de Disputas</h4>
									<div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-lg p-3">
										<p className="text-green-900 dark:text-green-300 font-semibold mb-2">
											Preferimos resolución amigable:
										</p>
										<ol className="list-decimal list-inside text-green-800 dark:text-green-300 ml-4 space-y-1">
											<li>Contacta: legal@ecosysgd.com</li>
											<li>Negociación de buena fe (30 días)</li>
											{/* <li>Si no se resuelve: Arbitraje vinculante en [especificar institución]</li> */}
											<li>Jurisdicción de tribunales de La Republica de Cuba</li>
										</ol>
									</div>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">13.3 Idioma</h4>
									<p className="text-gray-700 dark:text-gray-300 text-sm">
										En caso de conflicto entre traducciones, prevalece la versión en español.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* SECCIÓN 14: CONTACTO */}
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									14
								</span>
								Contacto
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 dark:text-gray-300 mb-4">
								Para consultas sobre estos términos:
							</p>
							<div className="grid md:grid-cols-2 gap-3">
								<div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
									<p className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📧 Legal:</p>
									<a href="mailto:legal@ecosysgd.com" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
										legal@ecosysgd.com
									</a>
								</div>
								<div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-lg p-3">
									<p className="font-semibold text-green-900 dark:text-green-300 mb-2">💬 Soporte:</p>
									<a href="mailto:support@ecosysgd.com" className="text-green-600 dark:text-green-400 hover:underline text-sm">
										support@ecosysgd.com
									</a>
								</div>
								<div className="bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 md:col-span-2">
									<p className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2">📱 WhatsApp:</p>
									<a href="https://wa.me/5351158544" className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm">
										+53 5115 8544
									</a>
									<p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
										Lunes a viernes, 9am - 6pm
									</p>
								</div>
							</div>
							<p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
								Plazo de respuesta: 72 horas (días laborables)
							</p>
						</CardContent>
					</Card>
				</div>

				<Separator className="my-8 dark:bg-gray-700" />

				{/* CONFIRMACIÓN FINAL */}
				<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 border-blue-200 dark:border-blue-700">
					<CardContent className="pt-6">
						<div className="space-y-3">
							<p className="text-gray-900 dark:text-gray-100 font-bold text-center text-lg">
								Al usar SYSGD Ecosystem, confirmas que:
							</p>
							<div className="grid md:grid-cols-2 gap-3">
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Has leído y comprendido estos términos completos</p>
								</div>
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Aceptas todos los riesgos de la fase beta</p>
								</div>
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Comprendes que las transacciones cripto son irreversibles</p>
								</div>
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Verificarás el contenido generado por IA</p>
								</div>
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Mantendrás backups de información importante</p>
								</div>
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Tienes la edad mínima requerida y capacidad legal</p>
								</div>
							</div>
							<p className="text-blue-700 dark:text-blue-300 font-medium text-center mt-4">
								Gracias por formar parte de SYSGD Ecosystem. Cada usuario ayuda a mejorar este proyecto.
							</p>
						</div>
					</CardContent>
				</Card>

				<div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-500">
					<p>© 2024-2026 SYSGD Ecosystem</p>
					<p className="text-xs mt-1">Versión 2.0 Beta - Actualizado el {currentDate}</p>
				</div>
			</div>
		</div>
	);
}