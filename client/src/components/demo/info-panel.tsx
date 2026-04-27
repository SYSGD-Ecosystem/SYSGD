interface InfoPanelProps {
	activeSection: string;
}

export function InfoPanel({ activeSection }: InfoPanelProps) {
	const documentInfo = {
		title: "Código",
		content:
			"Cada documento se identifica con un código único, estos pueden ser alfanuméricos y deberían estar directamente relacionado con el organigrama archivístico funcional",
	};

	const projectInfo = {
		title: "Gestión",
		content:
			"Las tareas se organizan por prioridad y estado. Utiliza el sistema de etiquetas para categorizar y el tablero Kanban para visualizar el progreso del proyecto.",
	};

	const info = activeSection === "documents" ? documentInfo : projectInfo;

	return (
		<aside className="w-80 bg-gray-50 border-l border-gray-200 p-4">
			<div className="bg-white rounded-lg p-4 shadow-sm">
				<div className="flex items-center gap-2 mb-3">
					<div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
						<span className="text-white text-xs font-bold">i</span>
					</div>
					<h3 className="font-semibold text-gray-900">{info.title}</h3>
				</div>
				<p className="text-sm text-gray-600 leading-relaxed mb-4">
					{info.content}
				</p>
				{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
				<button className="text-blue-600 text-sm hover:underline">
					Saber más...
				</button>
			</div>
		</aside>
	);
}
