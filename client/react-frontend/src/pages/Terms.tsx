import { FileText, Mail, Phone, AlertTriangle, Coins, Sparkles } from "lucide-react";
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
					<Badge variant="outline" className="text-lg px-4 py-2">
						SYSGD Ecosystem
					</Badge>
					<p className="text-gray-600 dark:text-gray-400 mt-4">
						<strong>Fecha de entrada en vigor:</strong> {currentDate}
					</p>
				</div>

				{/* Alerta Beta Prominente */}
				<Alert className="mb-6 border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/50">
					<AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					<AlertDescription>
						<div className="space-y-2">
							<p className="font-bold text-amber-900 dark:text-amber-300 text-lg">
								⚠️ SISTEMA EN FASE BETA - LEE ESTO CUIDADOSAMENTE
							</p>
							<p className="text-amber-800 dark:text-amber-300">
								SYSGD Ecosystem está en desarrollo activo. Al usar este servicio, especialmente las funciones de pago con criptomonedas, aceptas que:
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

				<Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
					<CardContent className="pt-6">
						<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
							Bienvenido a <strong>SYSGD Ecosystem</strong>, una plataforma integral que combina 
							gestión documental, inteligencia artificial y servicios de pago con criptomonedas. 
							Al registrarte y utilizar este sistema, aceptas los siguientes Términos y Condiciones. 
							Si no estás de acuerdo, por favor, no utilices la plataforma.
						</p>
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									1
								</span>
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
									<li><strong>Inteligencia Artificial:</strong> Servicios de IA generativa para mejorar productividad</li>
									<li><strong>Sistema de Pagos Cripto:</strong> Compra de créditos y planes mediante USDT</li>
									<li><strong>Herramientas de Colaboración:</strong> Gestión de proyectos y tareas</li>
								</ul>
								<div className="bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mt-3">
									<p className="text-amber-800 dark:text-amber-300 text-sm">
										<strong>Fase Beta:</strong> El sistema está en desarrollo activo. Funciones pueden cambiar, 
										fallar o comportarse de forma inesperada.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									2
								</span>
								Uso permitido
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 dark:text-gray-300 mb-3">El usuario se compromete a:</p>
							<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
								<li>Utilizar SYSGD únicamente con fines legítimos y conforme a las leyes aplicables</li>
								<li>No intentar acceder, alterar o eliminar datos de otros usuarios</li>
								<li>No cargar contenido ilegal, ofensivo o que viole derechos de terceros</li>
								<li>No realizar ingeniería inversa, hackeo o pruebas de seguridad sin autorización</li>
								<li>No abusar del sistema de créditos, IA o pagos para fines fraudulentos</li>
								<li>No usar servicios de IA para generar contenido dañino, ilegal o engañoso</li>
								<li>Verificar los exactitud del contenido generado por IA antes de usarlo</li>
							</ul>
						</CardContent>
					</Card>

					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									3
								</span>
								Cuentas de usuario
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
								<li>El usuario es responsable de mantener la confidencialidad de sus credenciales</li>
								<li>El uso indebido de cuentas puede derivar en la suspensión o eliminación sin previo aviso</li>
								<li>La eliminación de una cuenta puede solicitarse mediante contacto directo</li>
								<li><strong>Al eliminar una cuenta, se perderán todos los créditos no utilizados sin derecho a reembolso</strong></li>
								<li>No se permite compartir cuentas o transferir créditos entre usuarios</li>
							</ul>
						</CardContent>
					</Card>

					<Card className="border-2 border-blue-500 dark:border-blue-400 dark:bg-gray-800">
						<CardHeader className="bg-blue-50 dark:bg-blue-900/50">
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-600 dark:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									4
								</span>
								<Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								Sistema de Pagos con Criptomonedas
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6">
							<div className="space-y-4">
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.1 Método de Pago</h4>
									<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
										SYSGD acepta pagos en <strong>USDT (Tether)</strong> a través de blockchain. 
										Durante la fase beta utilizamos la red <strong>Ethereum Sepolia (testnet)</strong>. 
										En producción se utilizarán redes principales.
									</p>
								</div>

								<div className="bg-red-50 dark:bg-red-900/50 border-2 border-red-500 dark:border-red-400 rounded-lg p-4">
									<h4 className="font-bold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
										<AlertTriangle className="h-5 w-5" />
										4.2 TRANSACCIONES IRREVERSIBLES
									</h4>
									<p className="text-red-800 dark:text-red-300 leading-relaxed">
										⚠️ <strong>Las transacciones blockchain NO pueden revertirse.</strong> Una vez 
										enviado el pago, es <strong>IMPOSIBLE</strong> recuperarlo automáticamente. 
										Verifica cuidadosamente todos los detalles antes de confirmar cualquier transacción.
									</p>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.3 Créditos y Planes</h4>
									<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
										<li>Los créditos se utilizan para servicios de IA y funciones premium</li>
										<li>Los créditos adquiridos <strong>no tienen fecha de expiración durante la beta</strong></li>
										<li>Los planes de suscripción pueden renovarse automáticamente si se configura</li>
										<li>Los precios están sujetos a cambios con previo aviso de 30 días</li>
										<li><strong>NO se garantiza reembolso</strong> por créditos no utilizados o errores del usuario</li>
									</ul>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.4 Errores en Transacciones</h4>
									<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
										Si experimentas un error técnico durante el procesamiento de pagos 
										(ejemplo: doble cobro, créditos no acreditados), contacta inmediatamente 
										con soporte. Analizaremos cada caso individualmente, pero <strong>no garantizamos 
										solución o reembolso</strong>, especialmente para errores del usuario.
									</p>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.5 Wallets y Seguridad</h4>
									<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
										<li>Eres responsable de la seguridad de tu wallet de criptomonedas</li>
										<li>SYSGD nunca te pedirá tu clave privada</li>
										<li>Verifica siempre que estás en el sitio oficial antes de realizar pagos</li>
										<li>No nos hacemos responsables por transacciones enviadas a direcciones incorrectas</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-2 border-purple-500 dark:border-purple-400 dark:bg-gray-800">
						<CardHeader className="bg-purple-50 dark:bg-purple-900/50">
							<CardTitle className="flex items-center gap-2">
								<span className="bg-purple-600 dark:bg-purple-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									5
								</span>
								<Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
								Servicios de Inteligencia Artificial
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6">
							<div className="space-y-4">
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.1 Consumo de Créditos</h4>
									<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
										Los servicios de IA consumen créditos según el modelo y tipo de operación. 
										Las tarifas están disponibles en la sección de precios y pueden variar.
									</p>
								</div>

								<div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
									<h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">5.2 Calidad y Precisión del Contenido</h4>
									<p className="text-yellow-800 dark:text-yellow-300 leading-relaxed">
										<strong>NO garantizamos</strong> la precisión, calidad o idoneidad del contenido 
										generado por IA. Los modelos pueden:
									</p>
									<ul className="list-disc list-inside space-y-1 text-yellow-800 dark:text-yellow-300 ml-4 mt-2">
										<li>Generar información incorrecta o desactualizada</li>
										<li>Producir contenido sesgado o inapropiado</li>
										<li>Cometer errores factuales o de lógica</li>
									</ul>
									<p className="text-yellow-800 dark:text-yellow-300 mt-2 font-semibold">
										El usuario es responsable de verificar y validar todo contenido generado.
									</p>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.3 Uso Responsable</h4>
									<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
										<li>No usar IA para decisiones críticas sin verificación humana</li>
										<li>No generar contenido que viole derechos de terceros</li>
										<li>No usar IA para spam, desinformación o contenido malicioso</li>
										<li>Respetar los los términos de uso de los modelos de IA subyacentes</li>
									</ul>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.4 Propiedad del Contenido</h4>
									<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
										El contenido generado por IA pertenece al usuario que lo solicitó, 
										sujeto a las limitaciones de los modelos de IA utilizados. SYSGD no 
										reclama propiedad sobre el contenido generado.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									6
								</span>
								Disponibilidad del servicio
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
								<li>SYSGD no garantiza disponibilidad continua, integridad de los datos ni ausencia de errores</li>
								<li>El servicio no sufrir interrupciones sin previo aviso debido a mantenimiento o errores</li>
								<li>Los servicios de IA pueden tener límites de uso o estar temporalmente no disponibles</li>
								<li>Durante la fase beta, pueden realizarse cambios significativos sin previo aviso</li>
								<li><strong>Se recomienda mantener copias de seguridad</strong> de información importante</li>
							</ul>
						</CardContent>
					</Card>

					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									7
								</span>
								Propiedad intelectual
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
									Todo el código, estructura, diseño y elementos internos de SYSGD 
									pertenecen a su creador. El uso del sistema no implica cesión de 
									derechos, salvo los necesarios para acceder y utilizar sus 
									funcionalidades conforme a estos términos.
								</p>
								<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
									Los usuarios conservan todos los derechos sobre el contenido que 
									suben o generan en SYSGD, sujeto a las limitaciones de los 
									servicios de terceros utilizados (como modelos de IA).
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									8
								</span>
								Modificaciones
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
								Nos reservamos el derecho de modificar estos Términos en cualquier momento. 
								Los cambios serán notificados dentro de la plataforma con <strong>al menos 
								7 días de anticipación</strong> para cambios significativos. El uso continuado 
								de SYSGD después de dichos cambios implica tu aceptación.
							</p>
						</CardContent>
					</Card>

					<Card className="border-2 border-red-500 dark:border-red-400 dark:bg-gray-800">
						<CardHeader className="bg-red-50 dark:bg-red-900/50">
							<CardTitle className="flex items-center gap-2">
								<span className="bg-red-600 dark:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									9
								</span>
								<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
								Limitación de responsabilidad
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
										<li><strong>Pérdidas económicas</strong> derivadas de transacciones, errores del sistema o uso de servicios</li>
										<li><strong>Pérdida de datos</strong>, archivos o información almacenada</li>
										<li><strong>Errores en contenido generado por IA</strong> o decisiones basadas en dicho contenido</li>
										<li><strong>Transacciones blockchain incorrectas</strong> o enviadas a direcciones equivocadas</li>
										<li><strong>Créditos gastados</strong> en operaciones fallidas o contenido insatisfactorio</li>
										<li><strong>Accesos no autorizados</strong>, brechas de seguridad o vulnerabilidades</li>
										<li><strong>Interrupciones del servicio</strong>, mantenimientos o cambios en funcionalidades</li>
										<li>Cualquier <strong>daño directo, indirecto, consecuencial o punitivo</strong></li>
									</ul>
								</div>
								<p className="text-red-600 dark:text-red-400 font-bold text-center mt-4">
									⚠️ UTILIZAS SYSGD BAJO TU PROPIO RIESGO Y RESPONSABILIDAD
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									10
								</span>
								Cancelación y Terminación
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">10.1 Por el Usuario</h4>
									<p className="text-gray-700 dark:text-gray-300">
										Puedes cancelar tu cuenta en cualquier momento. Los créditos no utilizados 
										se perderán <strong>sin derecho a reembolso</strong>.
									</p>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">10.2 Por SYSGD</h4>
									<p className="text-gray-700 dark:text-gray-300">
										Nos reservamos el derecho de suspender o terminar cuentas que violen estos 
										términos, sin previo aviso y sin reembolso de créditos.
									</p>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">10.3 Fin de la Fase Beta</h4>
									<p className="text-gray-700 dark:text-gray-300">
										Al finalizar la beta, el servicio puede discontinuarse, cambiar significativamente 
										o migrar a una versión de pago. Se notificará con al menos 30 días de anticipación.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									11
								</span>
								Contacto
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 dark:text-gray-300 mb-4">
								Para cualquier duda, solicitud o reporte de problemas relacionados con estos términos:
							</p>
							<div className="space-y-3">
								<div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
									<Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									<a
										href="mailto:lazaroyunier96@outlook.es"
										className="text-blue-600 dark:text-blue-400 hover:underline"
									>
										lazaroyunier96@outlook.es
									</a>
								</div>
								<div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
									<Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
									<a
										href="https://wa.me/5351158544"
										className="text-green-600 dark:text-green-400 hover:underline"
									>
										WhatsApp: +53 5115 8544
									</a>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Separator className="my-8 dark:bg-gray-700" />

				<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 border-blue-200 dark:border-blue-700">
					<CardContent className="pt-6">
						<div className="space-y-3">
							<p className="text-gray-900 dark:text-gray-100 font-bold text-center text-lg">
								Al usar SYSGD Ecosystem, confirmas que:
							</p>
							<div className="grid md:grid-cols-2 gap-3">
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Has leído y comprendido estos términos</p>
								</div>
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Aceptas todos los riesgos de la fase beta</p>
								</div>
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Comprendes que las transacciones son irreversibles</p>
								</div>
								<div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
									<p className="text-sm text-gray-700 dark:text-gray-300">✓ Verificarás el contenido generado por IA</p>
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
				</div>
			</div>
		</div>
	);
}