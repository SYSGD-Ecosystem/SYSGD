import {
	AlertTriangle,
	Database,
	Lock,
	Mail,
	Phone,
	Shield,
	Trash2,
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
						SYSGD - Versión Beta
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
							<p className="text-gray-700 leading-relaxed">
								Recopilamos datos que los usuarios proporcionan al registrarse
								en la plataforma, como <strong>nombre</strong>,{" "}
								<strong>correo electrónico</strong> y{" "}
								<strong>contraseña</strong> (esta última cifrada).
							</p>
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
							<p className="text-gray-700 leading-relaxed">
								Los datos se utilizan exclusivamente para{" "}
								<strong>brindar acceso a la plataforma</strong> y{" "}
								<strong>asociar documentos a cuentas de usuario</strong>. No
								compartimos esta información con terceros.
							</p>
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
							<div className="space-y-3">
								<p className="text-gray-700 leading-relaxed">
									Implementamos medidas básicas de seguridad, incluyendo:
								</p>
								<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
									<li>Cifrado de contraseñas</li>
									<li>Almacenamiento en base de datos protegida</li>
								</ul>
								<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
									<p className="text-amber-800 text-sm">
										<strong>Nota:</strong> Actualmente estamos en fase beta, por
										lo tanto, es posible que algunas medidas aún estén en
										desarrollo.
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
								¿Quién puede ver tus datos?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-gray-700 leading-relaxed">
									Solo el <strong>administrador del sistema</strong> tiene
									acceso técnico a la base de datos.
								</p>
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
									<p className="text-blue-800 text-sm">
										<strong>Recomendación:</strong> Se recomienda no introducir
										información extremadamente confidencial en esta etapa beta.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									5
								</span>
								<Trash2 className="h-5 w-5 text-green-600" />
								¿Puedo eliminar mi cuenta?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 leading-relaxed">
								<strong>Sí.</strong> Puedes solicitar la eliminación de tu
								cuenta y todos los datos asociados escribiendo a{" "}
								<a
									href="mailto:lazaroyunier96@outlook.es"
									className="text-blue-600 hover:underline font-medium"
								>
									lazaroyunier96@outlook.es
								</a>
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									6
								</span>
								<AlertTriangle className="h-5 w-5 text-amber-600" />
								Sobre la versión beta
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
								<p className="text-gray-700 leading-relaxed">
									Este sistema se encuentra en{" "}
									<strong>desarrollo activo</strong>. Al utilizar esta versión,
									entiendes que pueden existir errores, cambios inesperados y
									funcionalidades incompletas.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
									7
								</span>
								Contacto
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 mb-4">
								Para cualquier duda o solicitud relacionada con tu información
								personal, puedes contactar a:
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
						<p className="text-green-700">
							Trabajamos continuamente para mejorar la seguridad y protección de
							tus datos en SYSGD.
						</p>
					</CardContent>
				</Card>

				<div className="text-center mt-8 text-sm text-gray-500">
					<p>© 2024 SYSGD - Sistema de Gestión Documental</p>
				</div>
			</div>
		</div>
	);
}
