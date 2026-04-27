import { useState } from "react";

export const useGeminiAgent = () => {
	const [improvedText, setImprovedText] = useState("");
	const [loading, setLoading] = useState(false);

	const handleImprove = async (prompt: string) => {
		setLoading(true);
		setImprovedText("");
		try {
			const response = await fetch("http://localhost:3000/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include", // si usas cookies para la sesión
				body: JSON.stringify({
					prompt,
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
