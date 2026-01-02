import {
	AlertTriangle,
	Database,
	Lock,
	Mail,
	Phone,
	Shield,
	Trash2,
	Coins,
	Sparkles,
	Eye,
	Server,
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
		<div className="min-h-screen bg-gray-50 py-8 px-4">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<div className="flex items-center justify-center gap-2 mb-4">
						<Shield className="h-8 w-8 text-green-600" />
						<h1 className="text-3xl font-bold text-gray-900">
							Política de Privacidad
						</h1>
					</div>
					<Badge
						variant="outline"
						className="text-lg px-4 py-2 bg-green-50 text-green-700 border-green-200"
					>
						SYSGD Ecosystem - Versión Beta
					</Badge>
					<p className="text-gray-600 mt-4">
						<strong>Última actualización:</strong> {currentDate}
					</p>
				</div>

				<Alert className="mb-6 border-amber-200 bg-amber-50">
					<AlertTriangle className="h-4 w-4 text-amber-600" />
					<AlertDescription className="text-amber-800">
						<strong>Aviso importante:</strong> Este sistema se encuentra en fase
						beta. Algunas medidas de seguridad pueden estar aún en desarrollo.
						<strong> No recomendamos almacenar información extremadamente sensible</strong> durante esta fase.
					</AlertDescription>
				</Alert>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									1
								</span>
								<Database className="h-5 w-5 text-green-600" />
								¿Qué información recopilamos?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<h4 className="font-semibold text-gray-900 mb-2">1.1 Información de Cuenta</h4>
									<p className="text-gray-700 leading-relaxed mb-2">
										Al registrarte, recopilamos:
									</p>
									<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
										<li><strong>Nombre</strong> y <strong>apellidos</strong></li>
										<li><strong>Correo electrónico</strong> (usado para inicio de sesión y notificaciones)</li>
										<li><strong>Contraseña</strong> (cifrada y nunca almacenada en texto plano)</li>
										<li>Fecha y hora de registro</li>
									</ul>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 mb-2">1.2 Información de Uso</h4>
									<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
										<li>Documentos y archivos que subes a la plataforma</li>
										<li>Proyectos, tareas y contenido que creas</li>
										<li>Prompts y solicitudes enviadas a servicios de IA</li>
										<li>Historial de consumo de créditos</li>
										<li>Logs de actividad en el sistema (accesos, operaciones realizadas)</li>
									</ul>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 mb-2">1.3 Información de Pagos</h4>
									<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
										<li><strong>Dirección de wallet</strong> desde la que realizas pagos</li>
										<li>Hash de transacciones blockchain</li>
										<li>Historial de compras de créditos y planes</li>
										<li><strong>NO almacenamos claves privadas ni seed phrases</strong></li>
									</ul>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 mb-2">1.4 Datos Técnicos</h4>
									<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
										<li>Dirección IP</li>
										<li>Tipo de navegador y sistema operativo</li>
										<li>Información de dispositivo (para adaptar la interfaz)</li>
										<li>Cookies de sesión (para mantener tu sesión activa)</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									2
								</span>
								¿Para qué usamos la información?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 leading-relaxed">
									Utilizamos tus datos para:
								</p>
								<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
									<li><strong>Proporcionar el servicio:</strong> Gestión de documentos, acceso a IA, procesamiento de pagos</li>
									<li><strong>Autenticación:</strong> Verificar tu identidad al iniciar sesión</li>
									<li><strong>Procesamiento de pagos:</strong> Validar transacciones y acreditar créditos</li>
									<li><strong>Servicios de IA:</strong> Procesar tus prompts y generar contenido</li>
									<li><strong>Mejora del servicio:</strong> Analizar uso para optimizar funcionalidades</li>
									<li><strong>Comunicaciones:</strong> Enviar notificaciones importantes sobre tu cuenta</li>
									<li><strong>Soporte técnico:</strong> Resolver problemas y responder consultas</li>
									<li><strong>Seguridad:</strong> Detectar y prevenir fraudes o usos indebidos</li>
								</ul>
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
									<p className="text-blue-800 text-sm font-semibold">
										📌 NO compartimos tu información con terceros para fines comerciales o publicitarios
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									3
								</span>
								<Lock className="h-5 w-5 text-green-600" />
								¿Cómo protegemos la información?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<p className="text-gray-700 leading-relaxed">
									Implementamos múltiples capas de seguridad:
								</p>
								
								<div className="grid md:grid-cols-2 gap-3">
									<div className="bg-green-50 rounded-lg p-3 border border-green-200">
										<h5 className="font-semibold text-green-900 mb-1">✓ Cifrado de contraseñas</h5>
										<p className="text-sm text-green-800">Con bcrypt, irreversible</p>
									</div>
									<div className="bg-green-50 rounded-lg p-3 border border-green-200">
										<h5 className="font-semibold text-green-900 mb-1">✓ HTTPS/SSL</h5>
										<p className="text-sm text-green-800">Comunicación encriptada</p>
									</div>
									<div className="bg-green-50 rounded-lg p-3 border border-green-200">
										<h5 className="font-semibold text-green-900 mb-1">✓ Base de datos segura</h5>
										<p className="text-sm text-green-800">Acceso restringido y monitoreado</p>
									</div>
									<div className="bg-green-50 rounded-lg p-3 border border-green-200">
										<h5 className="font-semibold text-green-900 mb-1">✓ Tokens de sesión</h5>
										<p className="text-sm text-green-800">Autenticación segura con JWT</p>
									</div>
								</div>

								<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
									<p className="text-amber-800 text-sm">
										<strong>Fase Beta:</strong> Aunque implementamos medidas de seguridad estándar, 
										el sistema está en desarrollo activo. <strong>No podemos garantizar protección 
										absoluta</strong>. Recomendamos no almacenar datos extremadamente sensibles 
										(información médica, financiera crítica, etc.) durante esta fase.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									4
								</span>
								<Eye className="h-5 w-5 text-green-600" />
								¿Quién puede ver tus datos?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<h4 className="font-semibold text-gray-900 mb-2">4.1 Acceso Interno</h4>
									<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
										<li>Solo el <strong>administrador del sistema</strong> tiene acceso técnico a la base de datos</li>
										<li>El acceso se realiza únicamente para mantenimiento, soporte o mejoras</li>
										<li>Todo acceso es registrado en logs de auditoría</li>
									</ul>
								</div>

								<div>
									<h4 className="font-semibold text-gray-900 mb-2">4.2 Servicios de Terceros</h4>
									<p className="text-gray-700 mb-2">Compartimos información mínima con:</p>
									<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
										<li><strong>Proveedores de IA</strong> (Google Gemini): Solo los prompts que envías para generar contenido</li>
										<li><strong>Blockchain pública</strong>: Direcciones de wallet y transacciones son públicas por naturaleza</li>
										<li><strong>Servicios de hosting</strong>: Datos técnicos necesarios para el funcionamiento</li>
									</ul>
								</div>

								<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
									<p className="text-blue-800 text-sm">
										<strong>Importante:</strong> Los documentos que subes y el contenido generado por IA 
										pueden ser procesados por servicios externos para proporcionar funcionalidad, 
										pero no son compartidos con fines comerciales.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-2 border-purple-500">
						<CardHeader className="bg-purple-50">
							<CardTitle className="flex items-center gap-2">
								<span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									5
								</span>
								<Sparkles className="h-5 w-5 text-purple-600" />
								Privacidad y Servicios de IA
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6">
							<div className="space-y-3">
								<p className="text-gray-700 leading-relaxed">
									Cuando usas servicios de IA en SYSGD:
								</p>
								<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
									<li>Tus prompts son enviados a proveedores de IA (actualmente Google Gemini)</li>
									<li>Los proveedores procesan tu contenido según sus propias políticas de privacidad</li>
									<li>No tenemos control sobre cómo los proveedores de IA usan los datos para entrenamiento</li>
									<li>El contenido generado se almacena en tu cuenta de SYSGD</li>
								</ul>
								<div className="bg-purple-50 border border-purple-300 rounded-lg p-3 mt-3">
									<p className="text-purple-800 text-sm font-semibold">
										⚠️ Recomendación: No incluyas información personal sensible en prompts de IA
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-2 border-blue-500">
						<CardHeader className="bg-blue-50">
							<CardTitle className="flex items-center gap-2">
								<span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									6
								</span>
								<Coins className="h-5 w-5 text-blue-600" />
								Privacidad en Transacciones Blockchain
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-6">
							<div className="space-y-3">
								<p className="text-gray-700 leading-relaxed">
									Aspectos importantes sobre privacidad en pagos con criptomonedas:
								</p>
								<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
									<li><strong>Las transacciones blockchain son públicas</strong> y cualquiera puede verlas en exploradores de bloques</li>
									<li>Asociamos tu dirección de wallet con tu cuenta SYSGD internamente</li>
									<li>El historial de transacciones se mantiene para reconciliación y soporte</li>
									<li><strong>Nunca solicitamos ni almacenamos claves privadas</strong></li>
									<li>Las transacciones son pseudónimas (vinculadas a wallet, no directamente a identidad)</li>
								</ul>
								<div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mt-3">
									<p className="text-blue-800 text-sm">
										💡 Si prefieres mayor privacidad, considera usar una wallet diferente para cada transacción
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									7
								</span>
								<Server className="h-5 w-5 text-green-600" />
								Retención de Datos
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 leading-relaxed">
									Conservamos tus datos mientras:
								</p>
								<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
									<li>Tu cuenta esté activa</li>
									<li>Sea necesario para proporcionar el servicio</li>
									<li>Sea requerido por obligaciones legales</li>
									<li>Sea necesario para resolver disputas o hacer cumplir acuerdos</li>
								</ul>
								<p className="text-gray-700 leading-relaxed mt-3">
									Al eliminar tu cuenta, la mayoría de tus datos se eliminarán permanentemente. 
									Sin embargo, podemos conservar:
								</p>
								<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
									<li>Registros de transacciones (por obligaciones contables)</li>
									<li>Logs de seguridad y auditoría</li>
									<li>Datos anonimizados para estadísticas</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									8
								</span>
								Tus Derechos de Privacidad
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 leading-relaxed">Tienes derecho a:</p>
								<div className="grid md:grid-cols-2 gap-3">
									<div className="bg-gray-50 rounded-lg p-3 border">
										<h5 className="font-semibold text-gray-900 mb-1">✓ Acceder</h5>
										<p className="text-sm text-gray-700">Ver qué datos tenemos sobre ti</p>
									</div>
									<div className="bg-gray-50 rounded-lg p-3 border">
										<h5 className="font-semibold text-gray-900 mb-1">✓ Rectificar</h5>
										<p className="text-sm text-gray-700">Corregir información incorrecta</p>
									</div>
									<div className="bg-gray-50 rounded-lg p-3 border">
										<h5 className="font-semibold text-gray-900 mb-1">✓ Eliminar</h5>
										<p className="text-sm text-gray-700">Solicitar borrado de tu cuenta</p>
									</div>
									<div className="bg-gray-50 rounded-lg p-3 border">
										<h5 className="font-semibold text-gray-900 mb-1">✓ Exportar</h5>
										<p className="text-sm text-gray-700">Obtener copia de tus datos</p>
									</div>
								</div>
								<p className="text-gray-700 text-sm mt-3">
									Para ejercer estos derechos, contacta con nosotros en el correo indicado más abajo.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									9
								</span>
								<Trash2 className="h-5 w-5 text-green-600" />
								¿Puedo eliminar mi cuenta?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 leading-relaxed">
									<strong>Sí.</strong> Puedes solicitar la eliminación de tu cuenta y 
									la mayoría de los datos asociados escribiendo a{" "}
									<a
										href="mailto:lazaroyunier96@outlook.es"
										className="text-blue-600 hover:underline font-medium"
									>
										lazaroyunier96@outlook.es
									</a>
								</p>
								<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
									<p className="text-amber-800 text-sm">
										<strong>Ten en cuenta:</strong> Al eliminar tu cuenta perderás 
										todos los créditos no utilizados sin posibilidad de reembolso, 
										y se eliminarán permanentemente todos tus documentos y contenido.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									10
								</span>
								<AlertTriangle className="h-5 w-5 text-amber-600" />
								Sobre la versión beta
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
								<p className="text-gray-700 leading-relaxed">
									Este sistema se encuentra en <strong>desarrollo activo</strong>. 
									Al utilizar esta versión beta, entiendes que:
								</p>
								<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
									<li>Pueden existir vulnerabilidades de seguridad no descubiertas</li>
									<li>Las políticas de privacidad pueden cambiar según evolucione el sistema</li>
									<li>No se garantiza la permanencia de datos a largo plazo</li>
									<li>Se recomienda no almacenar información extremadamente sensible</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									11
								</span>
								Cookies y Tecnologías Similares
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 leading-relaxed mb-3">
								Utilizamos cookies esenciales para:
							</p>
							<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
								<li>Mantener tu sesión activa (token de autenticación)</li>
								<li>Recordar preferencias de interfaz (tema oscuro/claro)</li>
								<li>Análisis básico de uso para mejorar el servicio</li>
							</ul>
							<p className="text-gray-700 text-sm mt-3">
								<strong>No usamos cookies</strong> de terceros para publicidad o seguimiento entre sitios.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									12
								</span>
								Contacto
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 mb-4">
								Para preguntas, solicitudes o reportes sobre privacidad:
							</p>
							<div className="space-y-3">
								<div className="flex items-center gap-3 text-gray-700">
									<Mail className="h-5 w-5 text-blue-600" />
									<a
										href="mailto:lazaroyunier96@outlook.es"
										className="text-blue-600 hover:underline"
									>
										lazaroyunier96@outlook.es
									</a>
								</div>
								<div className="flex items-center gap-3 text-gray-700">
									<Phone className="h-5 w-5 text-green-600" />
									<a
										href="https://wa.me/5351158544"
										className="text-green-600 hover:underline"
									>
										WhatsApp: +53 5115 8544
									</a>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Separator className="my-8" />

				<Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
					<CardContent className="pt-6 text-center">
						<div className="flex items-center justify-center gap-2 mb-3">
							<Shield className="h-6 w-6 text-green-600" />
							<h3 className="text-lg font-semibold text-green-800">
								Tu privacidad es importante
							</h3>
						</div>
						<p className="text-green-700 mb-2">
							Trabajamos continuamente para mejorar la seguridad y protección de
							tus datos en SYSGD Ecosystem.
						</p>
						<p className="text-green-600 text-sm">
							Si tienes dudas sobre cómo manejamos tu información, no dudes en contactarnos.
						</p>
					</CardContent>
				</Card>

				<div className="text-center mt-8 text-sm text-gray-500">
					<p>© 2024-2026 SYSGD Ecosystem</p>
				</div>
			</div>
		</div>
	);
}