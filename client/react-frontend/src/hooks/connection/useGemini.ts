import { useState } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const useGemini = () => {
	const [improvedText, setImprovedText] = useState("");
	const [loading, setLoading] = useState(false);

	const handleImprove = async (title: string, description: string) => {
		setLoading(true);
		setImprovedText("");
		try {
			const response = await fetch(`${serverUrl}/api/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include", // si usas cookies para la sesión
				body: JSON.stringify({
					prompt: `Mejora este texto para una IA y hazlo más claro para tareas de proyecto.\n\nTítulo: ${title}\nDescripción: ${description}`,
				}),
			});

			const data = await response.json();
			setImprovedText(data.respuesta || "No se recibió texto.");
		} catch (err) {
			console.error("Error al llamar a la IA:", err);
			setImprovedText("⚠️ Error al conectar con la IA");
		} finally {
			setLoading(false);
		}
	};

	return { improvedText, loading, handleImprove };
};
