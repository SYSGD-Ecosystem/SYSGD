/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import {
	ArrowRight,
	BarChart3,
	Building2,
	CheckCircle,
	Cpu,
	FileText,
	FolderKanban,
	Github,
	Globe,
	LogIn,
	Mail,
	MapPin,
	Menu,
	Rocket,
	ShoppingCart,
	Sparkles,
	Target,
	Twitter,
	Users,
	X,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { IoLogoWhatsapp } from "react-icons/io5";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useUserCount from "@/hooks/connection/useUserCount";

export default function LandingPage() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { count, loading } = useUserCount();

	const ecosystemServices = [
		{
			icon: FileText,
			title: "SYSGD-DOCS",
			subtitle: "Gestión Documental",
			description:
				"Sistema completo para organización, clasificación y archivo digital de documentos empresariales.",
			status: "Disponible",
			statusColor: "bg-green-500",
			features: [
				"Clasificación automática",
				"Búsqueda avanzada",
				"Control de versiones",
				"Flujos de aprobación",
			],
		},
		{
			icon: FolderKanban,
			title: "SYSGD-PROJECTS",
			subtitle: "Gestión de Proyectos",
			description:
				"Herramientas avanzadas para administración de proyectos, equipos y seguimiento de tiempo.",
			status: "En Desarrollo",
			statusColor: "bg-blue-500",
			features: [
				"Tableros Kanban",
				"Seguimiento de tiempo",
				"Gestión de equipos",
				"Calendarios integrados",
			],
		},
		{
			icon: ShoppingCart,
			title: "SYSGD-COMMERCE",
			subtitle: "E-Commerce",
			description:
				"Plataforma de comercio electrónico integrada con gestión de inventario y análisis de ventas.",
			status: "Próximamente",
			statusColor: "bg-purple-500",
			features: [
				"Tienda online",
				"Gestión de inventario",
				"Pagos integrados",
				"Analytics de ventas",
			],
		},
		{
			icon: BarChart3,
			title: "SYSGD-ANALYTICS",
			subtitle: "Business Intelligence",
			description:
				"Inteligencia de negocio y análisis de datos para toma de decisiones estratégicas.",
			status: "Planificado",
			statusColor: "bg-orange-500",
			features: [
				"Dashboards interactivos",
				"Reportes personalizados",
				"Métricas en tiempo real",
				"Predicciones AI",
			],
		},
	];

	// const sponsors = [
	// 	{
	// 		name: "TechCorp Solutions",
	// 		logo: "TC",
	// 		description: "Líder en soluciones tecnológicas empresariales",
	// 		tier: "Platinum",
	// 	},
	// 	{
	// 		name: "InnovateLab",
	// 		logo: "IL",
	// 		description: "Laboratorio de innovación y desarrollo",
	// 		tier: "Gold",
	// 	},
	// 	{
	// 		name: "DataFlow Systems",
	// 		logo: "DF",
	// 		description: "Especialistas en flujo de datos",
	// 		tier: "Gold",
	// 	},
	// 	{
	// 		name: "CloudTech",
	// 		logo: "CT",
	// 		description: "Infraestructura en la nube",
	// 		tier: "Silver",
	// 	},
	// 	{
	// 		name: "DevOps Pro",
	// 		logo: "DP",
	// 		description: "Automatización y despliegue",
	// 		tier: "Silver",
	// 	},
	// 	{
	// 		name: "SecureNet",
	// 		logo: "SN",
	// 		description: "Ciberseguridad avanzada",
	// 		tier: "Silver",
	// 	},
	// ];

	const infrastructure = [
		{
			name: "Supabase",
			logo: "SB",
			description: "PostgreSQL & Cloud Storage",
			tier: "Data Core",
		},
		{
			name: "Replicate",
			logo: "RP",
			description: "Generación de Imágenes y Multimedia con IA",
			tier: "Creative AI",
		},
		{
			name: "Railway",
			logo: "RY",
			description: "Backend Engine & API Services",
			tier: "Cloud Compute",
		},
		{
			name: "Google Gemini",
			logo: "G",
			description: "Modelos de Lenguaje Avanzados",
			tier: "Cognitive AI",
		},
		{
			name: "Cloudflare",
			logo: "CF",
			description: "Seguridad y Redireccionamiento Edge",
			tier: "Network",
		},
		{
			name: "Netlify",
			logo: "NF",
			description: "Frontend & Edge Delivery",
			tier: "Production Host",
		},
		{
			name: "Vercel",
			logo: "VC",
			description: "Frontend Redundancy Layer",
			tier: "Backup Host",
		},
		{
			name: "MinIO",
			logo: "MO",
			description: "Local Object Storage Simulation",
			tier: "Development",
		},
		{
			name: "Arch Linux",
			logo: "AL",
			description: "Entorno de desarrollo base para máxima eficiencia",
			tier: "Core OS",
		},
		{
			name: "Ollama",
			logo: "🦙",
			description: "Inferencia de LLMs locales para privacidad total",
			tier: "Local AI",
		},
	];

	const benefits = [
		"Ecosistema integrado de servicios empresariales",
		"Escalabilidad automática según crecimiento",
		"Inteligencia artificial incorporada",
		"APIs abiertas para integraciones personalizadas",
		"Seguridad de nivel empresarial",
		"Soporte 24/7 especializado",
		"Actualizaciones continuas sin interrupciones",
		"Análisis predictivo y machine learning",
	];

	const testimonials = [
		{
			name: "María González",
			role: "CTO",
			company: "TechCorp",
			content:
				"SYSGD no es solo una herramienta, es un ecosistema completo que transformó nuestra operación digital. La integración entre módulos es perfecta.",
			rating: 5,
		},
		{
			name: "Carlos Rodríguez",
			role: "Director de Innovación",
			company: "InnovateSA",
			content:
				"La visión de ecosistema de SYSGD nos permitió consolidar múltiples herramientas en una sola plataforma. Increíble ROI.",
			rating: 5,
		},
		{
			name: "Ana Martínez",
			role: "Gerente General",
			company: "GlobalServices",
			content:
				"Desde documentos hasta proyectos y pronto e-commerce, SYSGD crece con nosotros. Es el futuro de la gestión empresarial.",
			rating: 5,
		},
	];

	return (
		<div className="min-h-screen bg-slate-900 text-white">
			<div className="fixed inset-0 z-0">
				<div className="nebula" />
			</div>

			{/* Navigation */}
			<nav className="z-50 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20 sticky top-0">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
								<Building2 className="w-6 h-6 text-white" />
							</div>
							<div>
								<span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
									SYSGD
								</span>
								<div className="text-xs text-cyan-400">Ecosystem</div>
							</div>
						</div>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center space-x-8">
							<a
								href="#ecosystem"
								className="text-gray-300 hover:text-cyan-400 transition-colors"
							>
								Ecosistema
							</a>
							<a
								href="#benefits"
								className="text-gray-300 hover:text-cyan-400 transition-colors"
							>
								Beneficios
							</a>
							<a
								href="#sponsors"
								className="text-gray-300 hover:text-cyan-400 transition-colors"
							>
								Powered By
							</a>
							<a
								href="#contact"
								className="text-gray-300 hover:text-cyan-400 transition-colors"
							>
								Contacto
							</a>
							<Button
								className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
								asChild
							>
								<Link to="/login">
									<LogIn className="w-4 h-4 mr-2" /> Acceder al Ecosistema
								</Link>
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
						<div className="md:hidden border-t border-cyan-500/20 py-4 bg-slate-900/95 backdrop-blur-md">
							<div className="flex flex-col space-y-4">
								<a
									href="#ecosystem"
									className="text-gray-300 hover:text-cyan-400 transition-colors"
								>
									Ecosistema
								</a>
								<a
									href="#services"
									className="text-gray-300 hover:text-cyan-400 transition-colors"
								>
									Servicios
								</a>
								<a
									href="#sponsors"
									className="text-gray-300 hover:text-cyan-400 transition-colors"
								>
									Powered By
								</a>
								<a
									href="#contact"
									className="text-gray-300 hover:text-cyan-400 transition-colors"
								>
									Contacto
								</a>
								<div className="flex gap-2 pt-4">
									<Button
										className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
										asChild
									>
										<Link to="/login">Acceder</Link>
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative z-10 py-20 px-4 sm:px-6 flex flex-col items-center justify-center lg:px-8 min-h-screen">
				<div className="max-w-7xl mx-auto text-center">
					<div className="mb-8">
						<img
							src="logo.png"
							alt="SYSGD Logo"
							className="w-32 h-32 rounded overflow-hidden mx-auto mb-6 drop-shadow-2xl"
						/>
					</div>
					<Badge className="mb-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/30 text-cyan-300">
						<Sparkles className="w-4 h-4 mr-2" />
						Ecosistema Tecnológico en Expansión
					</Badge>
					<h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
						El Futuro de la
						<br />
						<span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
							Gestión Empresarial
						</span>
					</h1>
					<p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
						SYSGD es más que software, es un{" "}
						<strong className="text-cyan-400">
							ecosistema tecnológico completo
						</strong>{" "}
						que evoluciona con tu empresa. Desde gestión documental hasta
						proyectos, e-commerce y análisis predictivo.
						<br />
						<span className="text-cyan-300">
							Una plataforma. Infinitas posibilidades.
						</span>
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
						<Button
							size="lg"
							className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg px-8 py-4"
							asChild
						>
							<Link to="/login">
								<Rocket className="w-5 h-5 mr-2" />
								Explorar Ecosistema
								<ArrowRight className="w-5 h-5 ml-2" />
							</Link>
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="hidden border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 text-lg px-8 py-4 bg-transparent"
						>
							<Globe className="w-5 h-5 mr-2" />
							Ver Demo
						</Button>
					</div>
					<p className="text-sm text-gray-400">
						✨ Incluye SYSGD-DOCS • SYSGD-PROJECTS en desarrollo • E-Commerce
						próximamente
					</p>
				</div>
			</section>

			{/* Ecosystem Services Section */}
			<section
				id="ecosystem"
				className="relative z-10 py-20 px-4 sm:px-6 lg:px-8"
			>
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<Badge className="mb-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300">
							<Cpu className="w-4 h-4 mr-2" />
							Servicios del Ecosistema
						</Badge>
						<h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
							Un Ecosistema que Crece Contigo
						</h2>
						<p className="text-xl text-gray-300 max-w-3xl mx-auto">
							Cada servicio de SYSGD está diseñado para integrarse
							perfectamente, creando un ecosistema tecnológico que se adapta y
							evoluciona con las necesidades de tu empresa
						</p>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{ecosystemServices.map((service, index) => (
							<Card
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								key={index}
								className="bg-slate-800/40 backdrop-blur-md border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20"
							>
								<CardHeader>
									<div className="flex items-start justify-between mb-4">
										<div className="w-14 h-14 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-cyan-400/30">
											<service.icon className="w-7 h-7 text-cyan-400" />
										</div>
										<div className="flex items-center gap-2">
											<div
												className={`w-2 h-2 ${service.statusColor} rounded-full animate-pulse`}
											/>
											<span className="text-xs text-gray-400">
												{service.status}
											</span>
										</div>
									</div>
									<Badge
										variant="outline"
										className="w-fit mb-2 border-cyan-400/30 text-cyan-300"
									>
										{service.title}
									</Badge>
									<CardTitle className="text-xl text-white">
										{service.subtitle}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-gray-300 mb-6">{service.description}</p>
									<div className="space-y-3">
										<h4 className="text-sm font-semibold text-cyan-400">
											Características principales:
										</h4>
										{service.features.map((feature, idx) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											<div key={idx} className="flex items-center gap-3">
												<CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
												<span className="text-sm text-gray-300">{feature}</span>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Sponsors Section */}
			<section
				id="sponsors"
				className="relative z-10 py-20 px-4 sm:px-6 lg:px-8"
			>
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<Badge className="mb-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-300">
							<Target className="w-4 h-4 mr-2" />
							Powered By
						</Badge>
						<h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
							Infraestructura y Tecnología
						</h2>
						<p className="text-xl text-gray-300 max-w-2xl mx-auto">
							SYSGD se construye sobre una arquitectura distribuida y
							resiliente, utilizando las plataformas líderes que garantizan alta
							disponibilidad y potencia de IA.
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
						{infrastructure.map((sponsor, index) => (
							<Card
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								key={index}
								className="bg-slate-800/30 backdrop-blur-md border-slate-700/30 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 group"
							>
								<CardContent className="p-6 text-center">
									<div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-cyan-400/30 group-hover:border-cyan-400/60 transition-colors">
										<span className="text-xl font-bold text-cyan-400">
											{sponsor.logo}
										</span>
									</div>
									<h3 className="font-semibold text-white text-sm mb-2">
										{sponsor.name}
									</h3>
									<p className="text-xs text-gray-400 mb-3">
										{sponsor.description}
									</p>
									<Badge
										className={`text-xs ${
											sponsor.tier === "Platinum"
												? "bg-gradient-to-r from-gray-300/20 to-gray-100/20 border-gray-300/30 text-gray-200"
												: sponsor.tier === "Gold"
													? "bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 border-yellow-400/30 text-yellow-300"
													: "bg-gradient-to-r from-gray-500/20 to-gray-400/20 border-gray-400/30 text-gray-300"
										}`}
									>
										{sponsor.tier}
									</Badge>
								</CardContent>
							</Card>
						))}
					</div>

					<div className="text-center">
						<Button
							variant="outline"
							className="border-cyan-400/50 hidden text-cyan-300 hover:bg-cyan-400/10 bg-transparent"
							size="lg"
						>
							<Building2 className="w-5 h-5 mr-2" />
							Convertirse en Sponsor
						</Button>
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section
				id="benefits"
				className="relative z-10 py-20 px-4 sm:px-6 lg:px-8"
			>
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div>
							<Badge className="mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-300">
								<Zap className="w-4 h-4 mr-2" />
								Ventajas del Ecosistema
							</Badge>
							<h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
								¿Por qué elegir SYSGD?
							</h2>
							<p className="text-xl text-gray-300 mb-8">
								Más que herramientas individuales, SYSGD es un ecosistema
								inteligente que conecta todos los aspectos de tu negocio en una
								experiencia unificada y potente.
							</p>
							<div className="space-y-4">
								{benefits.map((benefit, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									<div key={index} className="flex items-start gap-3">
										<CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
										<span className="text-gray-300">{benefit}</span>
									</div>
								))}
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Card className="p-6 text-center bg-slate-800/40 backdrop-blur-md border-slate-700/50">
								<div className="text-3xl font-bold text-cyan-400 mb-2">
									99.9%
								</div>
								<div className="text-sm text-gray-400">Uptime garantizado</div>
							</Card>
							<Card className="p-6 text-center bg-slate-800/40 backdrop-blur-md border-slate-700/50">
								<div className="text-3xl font-bold text-cyan-400 mb-2">
									{loading ? "..." : count}
								</div>
								<div className="text-sm text-gray-400">Usuarios activos</div>
							</Card>
							<Card className="p-6 text-center bg-slate-800/40 backdrop-blur-md border-slate-700/50">
								<div className="text-3xl font-bold text-cyan-400 mb-2">
									24/7
								</div>
								<div className="text-sm text-gray-400">
									Soporte especializado
								</div>
							</Card>
							<Card className="p-6 text-center bg-slate-800/40 backdrop-blur-md border-slate-700/50">
								<div className="text-3xl font-bold text-cyan-400 mb-2">4+</div>
								<div className="text-sm text-gray-400">
									Servicios integrados
								</div>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 hidden">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<Badge className="mb-4 bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-400/30 text-pink-300">
							<Users className="w-4 h-4 mr-2" />
							Testimonios
						</Badge>
						<h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
							Lo que Dicen Nuestros Usuarios
						</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{testimonials.map((testimonial, index) => (
							<Card
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								key={index}
								className="bg-slate-800/40 backdrop-blur-md border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300"
							>
								<CardContent className="p-6">
									<div className="flex mb-4">
										{[...Array(testimonial.rating)].map((_, i) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											<div key={i} className="w-4 h-4 text-yellow-400">
												⭐
											</div>
										))}
									</div>
									<p className="text-gray-300 mb-6 italic">
										"{testimonial.content}"
									</p>
									<div>
										<div className="font-semibold text-white">
											{testimonial.name}
										</div>
										<div className="text-sm text-cyan-400">
											{testimonial.role}
										</div>
										<div className="text-sm text-gray-400">
											{testimonial.company}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
						¿Listo para el Futuro?
					</h2>
					<p className="text-xl text-gray-300 mb-8">
						Únete al ecosistema tecnológico que está redefiniendo la gestión
						empresarial. SYSGD crece contigo.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button
							size="lg"
							className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg px-8 py-4"
							asChild
						>
							<Link to="/login">
								<Rocket className="w-5 h-5 mr-2" />
								Comenzar Ahora
								<ArrowRight className="w-5 h-5 ml-2" />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer
				id="contact"
				className="relative z-10 bg-slate-900/80 backdrop-blur-md border-t border-cyan-500/20 py-12 px-4 sm:px-6 lg:px-8"
			>
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div>
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
									<Building2 className="w-6 h-6 text-white" />
								</div>
								<div>
									<span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
										SYSGD
									</span>
									<div className="text-xs text-cyan-400">Ecosystem</div>
								</div>
							</div>
							<p className="text-gray-400 mb-4">
								El ecosistema tecnológico más avanzado para la gestión
								empresarial del futuro.
							</p>
							<div className="flex gap-2">
								<Button
									variant="ghost"
									size="sm"
									className="text-gray-400 hover:text-cyan-400"
								>
									<Link
										target="_blank"
										to="https://github.com/lazaroysr96/sysgd/"
									>
										<Github className="w-4 h-4" />
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="text-gray-400 hover:text-cyan-400"
								>
									<Link target="_blank" to="https://x.com/SYSGD_">
										<Twitter className="w-4 h-4" />
									</Link>
								</Button>
							</div>
						</div>
						<div>
							<h3 className="font-semibold mb-4 text-cyan-400">Ecosistema</h3>
							<div className="space-y-2 text-sm text-gray-400">
								<div>
									<Link to="/archives">SYSGD-DOCS</Link>
								</div>
								<div>
									<Link to="/projects">SYSGD-PROJECTS</Link>
								</div>

								{/* <div>SYSGD-COMMERCE</div>
								<div>SYSGD-ANALYTICS</div> */}
							</div>
						</div>
						<div>
							<h3 className="font-semibold mb-4 text-cyan-400">Soporte</h3>
							<div className="space-y-2 text-sm text-gray-400">
								{/* <div>Documentación</div>
								<div>Centro de ayuda</div>
								<div>API Reference</div>
								<div>Estado del servicio</div> */}
								<div>
									<Link to="/terms">Términos y Condiciones</Link>
								</div>
								<div>
									<Link to="/privacy">Plítica de Privacidad</Link>
								</div>
							</div>
						</div>
						<div>
							<h3 className="font-semibold mb-4 text-cyan-400">Contacto</h3>
							<div className="space-y-2 text-sm text-gray-400">
								<Link
									className="flex items-center gap-2"
									to="mailto:lazaroyunier96@gmail.com"
								>
									<Mail className="w-4 h-4" />
									lazaroyunier96@gmail.com
								</Link>
								<Link
									target="_blank"
									className="flex items-center gap-2"
									to="https://wa.me/+5353935724"
								>
									<IoLogoWhatsapp className="w-4 h-4" />
									+53 53935724
								</Link>
								<div className="flex items-center gap-2">
									<MapPin className="w-4 h-4" />
									Las Tunas, Cuba
								</div>
							</div>
						</div>
					</div>
					<div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-gray-400">
						<p>&copy; 2025 SYSGD Ecosystem. Todos los derechos reservados.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
