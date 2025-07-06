"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	FileText,
	Shield,
	Database,
	Users,
	BarChart3,
	CheckCircle,
	ArrowRight,
	Menu,
	X,
	Sun,
	Moon,
	Github,
	Mail,
	Phone,
	MapPin,
	Star,
	Zap,
	Twitter,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
	const [darkMode, setDarkMode] = useState(true);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [darkMode]);

	const features = [
		{
			icon: FileText,
			title: "Gestión Documental",
			description:
				"Organiza y clasifica todos tus documentos de manera eficiente con nuestro sistema de cuadros de clasificación.",
		},
		{
			icon: Database,
			title: "Archivo Digital",
			description:
				"Almacena y accede a tus documentos desde cualquier lugar con nuestro sistema de archivo digital seguro.",
		},
		{
			icon: Shield,
			title: "Seguridad Avanzada",
			description:
				"Protege tu información con niveles de acceso, encriptación y auditoría completa de actividades.",
		},
		{
			icon: Users,
			title: "Colaboración",
			description:
				"Trabaja en equipo con roles y permisos personalizables para cada usuario de tu organización.",
		},
		{
			icon: BarChart3,
			title: "Reportes y Analytics",
			description:
				"Obtén insights valiosos sobre el uso de documentos y la productividad de tu equipo.",
		},
		{
			icon: Zap,
			title: "Automatización",
			description:
				"Automatiza procesos repetitivos y flujos de trabajo para aumentar la eficiencia operativa.",
		},
	];

	const benefits = [
		"Reduce el tiempo de búsqueda de documentos en un 80%",
		"Cumple con normativas de archivo y gestión documental",
		"Acceso 24/7 desde cualquier dispositivo",
		"Backup automático y recuperación de desastres",
		"Integración con sistemas existentes",
		"Soporte técnico especializado",
	];

	const testimonials = [
		{
			name: "María González",
			role: "Directora de Operaciones",
			company: "TechCorp",
			content:
				"SYSGD transformó completamente nuestra gestión documental. Ahora encontramos cualquier documento en segundos.",
			rating: 5,
		},
		{
			name: "Carlos Rodríguez",
			role: "Gerente de TI",
			company: "InnovateSA",
			content:
				"La implementación fue sencilla y el equipo de soporte excepcional. Altamente recomendado.",
			rating: 5,
		},
		{
			name: "Ana Martínez",
			role: "Coordinadora Administrativa",
			company: "GlobalServices",
			content:
				"Por fin tenemos control total sobre nuestros documentos. La interfaz es intuitiva y potente.",
			rating: 5,
		},
	];

	return (
		<div className="min-h-screen bg-background text-foreground">
			{/* Navigation */}
			<nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm hover:bg-card/95">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
								<FileText className="w-4 h-4 text-primary-foreground" />
							</div>
							<span className="text-xl font-bold">SYSGD</span>
						</div>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center space-x-8">
							<a
								href="#features"
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								Características
							</a>
							<a
								href="#benefits"
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								Beneficios
							</a>
							<a
								href="#testimonials"
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								Testimonios
							</a>
							<a
								href="#contact"
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								Contacto
							</a>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setDarkMode(!darkMode)}
							>
								{darkMode ? (
									<Sun className="w-4 h-4" />
								) : (
									<Moon className="w-4 h-4" />
								)}
							</Button>
							<Button variant="outline" asChild>
								<Link to="/login">Iniciar Sesión</Link>
							</Button>
						</div>

						{/* Mobile menu button */}
						<div className="md:hidden">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							>
								{mobileMenuOpen ? (
									<X className="w-5 h-5" />
								) : (
									<Menu className="w-5 h-5" />
								)}
							</Button>
						</div>
					</div>

					{/* Mobile Navigation */}
					{mobileMenuOpen && (
						<div className="md:hidden border-t border-border py-4">
							<div className="flex flex-col space-y-4">
								<a
									href="#features"
									className="text-muted-foreground hover:text-foreground transition-colors"
								>
									Características
								</a>
								<a
									href="#benefits"
									className="text-muted-foreground hover:text-foreground transition-colors"
								>
									Beneficios
								</a>
								<a
									href="#testimonials"
									className="text-muted-foreground hover:text-foreground transition-colors"
								>
									Testimonios
								</a>
								<a
									href="#contact"
									className="text-muted-foreground hover:text-foreground transition-colors"
								>
									Contacto
								</a>
								<div className="flex gap-2 pt-4">
									<Button
										variant="outline"
										size="sm"
										asChild
										className="flex-1 bg-transparent"
									>
										<Link to="/login">Iniciar Sesión</Link>
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</nav>

			{/* Hero Section */}
			<section className="py-20 px-4 sm:px-6 h-screen flex flex-col items-center justify-center lg:px-8">
				<div className="max-w-7xl mx-auto text-center">
					<Badge variant="secondary" className="mb-4">
						🚀 Nueva versión disponible
					</Badge>
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
						Sistema de Gestión
						<br />
						<span className="text-primary">Documental Inteligente</span>
					</h1>
					<p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
						Transforma la manera en que tu organización maneja documentos. SYSGD
						te ofrece una solución completa para organizar, buscar y gestionar
						toda tu información de manera eficiente y segura.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button size="lg" asChild>
							<Link to="/login">
								Comenzar Gratis
								<ArrowRight className="w-4 h-4 ml-2" />
							</Link>
						</Button>
						<Button size="lg" variant="outline" asChild>
							<Link to="/demo">Ver Demo</Link>
						</Button>
					</div>
					<p className="text-sm text-muted-foreground mt-4">
						✨ Prueba gratuita de 30 días • Sin tarjeta de crédito •
						Configuración en 5 minutos
					</p>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl sm:text-4xl font-bold mb-4">
							Características Principales
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Descubre todas las herramientas que SYSGD pone a tu disposición
							para revolucionar tu gestión documental
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							<Card key={index} className="hover:shadow-lg transition-shadow">
								<CardHeader>
									<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
										<feature.icon className="w-6 h-6 text-primary" />
									</div>
									<CardTitle className="text-xl">{feature.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground">{feature.description}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div>
							<h2 className="text-3xl sm:text-4xl font-bold mb-6">
								¿Por qué elegir SYSGD?
							</h2>
							<p className="text-xl text-muted-foreground mb-8">
								Más que un simple sistema de archivos, SYSGD es tu aliado
								estratégico para la transformación digital de tu organización.
							</p>
							<div className="space-y-4">
								{benefits.map((benefit, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									<div key={index} className="flex items-start gap-3">
										<CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span>{benefit}</span>
									</div>
								))}
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Card className="p-6 text-center">
								<div className="text-3xl font-bold text-primary mb-2">
									99.9%
								</div>
								<div className="text-sm text-muted-foreground">
									Uptime garantizado
								</div>
							</Card>
							<Card className="p-6 text-center">
								<div className="text-3xl font-bold text-primary mb-2">500+</div>
								<div className="text-sm text-muted-foreground">
									Empresas confían en nosotros
								</div>
							</Card>
							<Card className="p-6 text-center">
								<div className="text-3xl font-bold text-primary mb-2">24/7</div>
								<div className="text-sm text-muted-foreground">
									Soporte técnico
								</div>
							</Card>
							<Card className="p-6 text-center">
								<div className="text-3xl font-bold text-primary mb-2">ISO</div>
								<div className="text-sm text-muted-foreground">
									Certificación de seguridad
								</div>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section
				id="testimonials"
				className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
			>
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl sm:text-4xl font-bold mb-4">
							Lo que dicen nuestros clientes
						</h2>
						<p className="text-xl text-muted-foreground">
							Más de 500 empresas ya transformaron su gestión documental con
							SYSGD
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{testimonials.map((testimonial, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							<Card key={index} className="hover:shadow-lg transition-shadow">
								<CardHeader>
									<div className="flex items-center gap-1 mb-2">
										{[...Array(testimonial.rating)].map((_, i) => (
											<Star
												// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
												key={i}
												className="w-4 h-4 fill-yellow-400 text-yellow-400"
											/>
										))}
									</div>
									<p className="text-muted-foreground italic">
										"{testimonial.content}"
									</p>
								</CardHeader>
								<CardContent>
									<div>
										<div className="font-semibold">{testimonial.name}</div>
										<div className="text-sm text-muted-foreground">
											{testimonial.role} • {testimonial.company}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-4 sm:px-6 lg:px-8">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl sm:text-4xl font-bold mb-6">
						¿Listo para transformar tu gestión documental?
					</h2>
					<p className="text-xl text-muted-foreground mb-8">
						Únete a cientos de empresas que ya optimizaron sus procesos con
						SYSGD
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button size="lg" asChild>
							<Link to="/login">
								Comenzar Ahora
								<ArrowRight className="w-4 h-4 ml-2" />
							</Link>
						</Button>
						{/* <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Contactar Ventas</Link>
            </Button> */}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer
				id="contact"
				className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8"
			>
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div>
							<div className="flex items-center gap-2 mb-4">
								<div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
									<FileText className="w-4 h-4 text-primary-foreground" />
								</div>
								<span className="text-xl font-bold">SYSGD</span>
							</div>
							<p className="text-muted-foreground mb-4">
								La solución más avanzada para la gestión documental empresarial.
							</p>
							<div className="flex gap-2">
								<Button variant="ghost" size="sm">
									<Link
										target="_blank"
										to="https://github.com/lazaroysr96/sysgd/"
									>
										<Github className="w-4 h-4" />
									</Link>
								</Button>
								<Button variant="ghost" size="sm">
									<Link target="_blank" to="https://x.com/SYSGD_">
										<Twitter className="w-4 h-4" />
									</Link>
								</Button>
							</div>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Producto</h3>
							<div className="space-y-2 text-sm text-muted-foreground">
								<div>Características</div>
								<div>Precios</div>
								<div>Integraciones</div>
								<div>API</div>
							</div>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Soporte</h3>
							<div className="space-y-2 text-sm text-muted-foreground">
								<div>Documentación</div>
								<div>Centro de ayuda</div>
								<div>Contacto</div>
								<div>Estado del servicio</div>
							</div>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Contacto</h3>
							<div className="space-y-2 text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									<Mail className="w-4 h-4" />
									lazaroyunier96@gmail.com
								</div>
								<div className="flex items-center gap-2">
									<Phone className="w-4 h-4" />
									+53 53935725
								</div>
								<div className="flex items-center gap-2">
									<MapPin className="w-4 h-4" />
									Las Tunas, Cuba
								</div>
							</div>
						</div>
					</div>
					<div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
						<p>&copy; 2025 SYSGD. Todos los derechos reservados.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
