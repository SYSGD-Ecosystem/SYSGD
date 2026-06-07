import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PLATFORM_TAGS = [
	{ label: "Android", color: "bg-green-500" },
	{ label: "Apklis", color: "bg-orange-500" },
	{ label: "Cuba", color: "bg-blue-500" },
];

interface AppCardProps {
	icon: string;
	iconAlt: string;
	name: string;
	description: string;
	price: string;
	installUrl: string;
	platforms?: typeof PLATFORM_TAGS;
}

function AppCard({
	icon,
	iconAlt,
	name,
	description,
	price,
	installUrl,
	platforms = PLATFORM_TAGS,
}: AppCardProps) {
	return (
		<Card className="p-6 md:p-8 flex flex-col gap-4">
			{/* Header: icono + nombre + precio */}
			<div className="flex items-start gap-4">
				<div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden">
					<img
						alt={iconAlt}
						src={icon}
						className="w-full h-full object-cover"
					/>
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between gap-2 flex-wrap">
						<h3 className="text-xl font-semibold leading-tight">{name}</h3>
						<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold shrink-0">
							{price}
						</Badge>
					</div>
				</div>
			</div>

			{/* Descripción */}
			<p className="text-muted-foreground leading-relaxed text-sm">
				{description}
			</p>

			{/* Footer: plataformas + botón */}
			<div className="flex items-center justify-between gap-4 mt-auto pt-2 border-t border-border/50">
				<div className="flex gap-4 flex-wrap">
					{platforms.map((p) => (
						<div
							key={p.label}
							className="flex items-center gap-1.5 text-sm text-muted-foreground"
						>
							<div className={`h-2 w-2 rounded-full ${p.color}`} />
							<span>{p.label}</span>
						</div>
					))}
				</div>
				<Button asChild size="sm" className="rounded-full shrink-0">
					<a href={installUrl} target="_blank" rel="noopener noreferrer">
						Instalar
					</a>
				</Button>
			</div>
		</Card>
	);
}

const apps: AppCardProps[] = [
	{
		icon: "/ic_gestor_contable_tcp.png",
		iconAlt: "Gestor Contable TCP Pro",
		name: "Gestor Contable TCP Pro",
		description:
			"Gestiona tu negocio de forma eficiente desde tu móvil. Permite registrar gastos e ingresos, administrar compras y ventas en puntos de venta, y consultar el nomenclador CNAE integrado.",
		price: "Pro",
		installUrl: "https://github.com/lazaroysr96/gestor-contable-tcp-releases/releases/download/2.2.10/app-release.apk",
	},
	{
		icon: "/ic_gestor_contable_tcp.png",
		iconAlt: "Gestor Contable TCP",
		name: "Gestor Contable TCP",
		description:
			"Gestiona tu negocio de forma eficiente desde tu móvil. Permite registrar gastos e ingresos, administrar compras y ventas en puntos de venta, y consultar el nomenclador CNAE integrado.",
		price: "50 CUP",
		installUrl: "https://www.apklis.cu/application/cu.lazaroysr96.sysgdcont",
	},
	{
		icon: "/ic_cnae.png",
		iconAlt: "Nomenclatura CNAE Pro",
		name: "Nomenclatura CNAE Pro",
		description:
			"Nomenclador completo del Clasificador Nacional de Actividades Económicas (CNAE). Incluye además el nomenclador de cuentas contables, una herramienta de referencia indispensable para contadores.",
		price: "40 CUP",
		installUrl:
			"https://www.apklis.cu/application/cu.lazaroysr96.nomesclaturacnae.pro",
	},
];



export default function AppsPage() {
	return (
		<div className="py-16 md:py-24">
			<div className="container mx-auto px-4 md:px-6">
				{/* Hero */}
				<div className="max-w-3xl mx-auto text-center mb-16">
					<h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
						Apps y Software
					</h1>
					<p className="text-lg text-muted-foreground text-pretty">
						Centro de desarrollo de software y aplicaciones para el entorno de
						SYSGD Ecosystem
					</p>
				</div>

				<div className="max-w-5xl mx-auto space-y-12">
					{/* Descripción */}
					<p className="text-lg leading-relaxed text-muted-foreground text-center max-w-3xl mx-auto">
						En SYSGD Ecosystem desarrollamos aplicaciones profesionales que
						optimizan la gestión empresarial, la contabilidad y los procesos de
						trabajo diario.
					</p>

					{/* Grid de apps */}
					<div className="grid gap-6 md:grid-cols-2">
						{apps.map((app) => (
							<AppCard key={app.name} {...app} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
