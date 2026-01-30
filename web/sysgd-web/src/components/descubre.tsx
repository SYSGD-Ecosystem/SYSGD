import type { FC } from "react";
import ReactPlayer from "react-player";

const Descubre: FC = () => {
	return (
		<section className="py-20 bg-blue-400 min-h-screen">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl font-bold text-center mb-8 text-white">Descubre SYSGD</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h3 className="text-xl font-semibold mb-4">Gestión Documental</h3>
						<p className="text-gray-600">
							Organiza y administra todos tus documentos de manera eficiente con
							nuestras herramientas avanzadas de gestión documental.
						</p>
					</div>
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h3 className="text-xl font-semibold mb-4">Proyectos y Tareas</h3>
						<p className="text-gray-600">
							Planifica, asigna y realiza un seguimiento de tus proyectos y
							tareas para garantizar que todo el equipo esté alineado y
							productivo.
						</p>
					</div>
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h3 className="text-xl font-semibold mb-4">
							Comunicación en Equipo
						</h3>
						<p className="text-gray-600">
							Facilita la colaboración y comunicación entre los miembros de tu
							equipo con nuestras herramientas integradas.
						</p>
					</div>
				</div>
			</div>
			<p className="text-gray-100 mt-8 text-center mb-4">
				Descubre cómo los agentes pueden optimizar tus procesos y mejorar la
				eficiencia de tu equipo.
			</p>
			<div className="mb-8 mt-8 flex items-center justify-center px-4">
				<div className="w-full max-w-3xl aspect-video rounded-lg overflow-hidden">
					<ReactPlayer
						width="100%"
						height="100%"
						src="https://youtu.be/8hz0w3CLY1A?si=vTojvIIeop9xfFNL"
					/>
				</div>
			</div>
		</section>
	);
};

export default Descubre;
