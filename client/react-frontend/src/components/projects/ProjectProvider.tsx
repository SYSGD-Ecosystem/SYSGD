import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import api from "@/lib/api"; // Tu instancia de axios configurada

interface ProjectData {
	id: string;
	name: string;
	description: string;
}

interface ProjectContextType {
	project: ProjectData | null;
	isLoading: boolean;
	error: string | null;
	refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({
	projectId,
	children,
}: {
	projectId: string;
	children: ReactNode;
}) => {
	const [project, setProject] = useState<ProjectData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchProjectInfo = async () => {
		setIsLoading(true);
		try {
			// Ajusta esta URL a tu endpoint real del backend
			const response = await api.get(`/api/projects/${projectId}`);
			setProject({
				id: projectId,
				name: response.data.name,
				description: response.data.description,
			});
			setError(null);
		} catch (err) {
			console.error("Error cargando info del proyecto:", err);
			setError("No se pudo cargar la información del proyecto");
		} finally {
			setIsLoading(false);
		}
	};

	// Recargar si el ID cambia
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		useEffect(() => {
		if (projectId) {
			fetchProjectInfo();
		}
	}, [projectId]);

	return (
		<ProjectContext.Provider
			value={{ project, isLoading, error, refreshProject: fetchProjectInfo }}
		>
			{children}
		</ProjectContext.Provider>
	);
};

export const useProjectContext = () => {
	const context = useContext(ProjectContext);
	if (!context) {
		throw new Error(
			"useProjectContext debe usarse dentro de un ProjectProvider",
		);
	}
	return context;
};
