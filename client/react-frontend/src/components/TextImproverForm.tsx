import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function TextImproverForm() {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [improvedText, setImprovedText] = useState("");
	const [loading, setLoading] = useState(false);

	const handleImprove = async () => {
		setLoading(true);
		setImprovedText("");
		try {
			const response = await fetch("http://localhost:3000/api/generate", {
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

	return (
		<Card className="max-w-2xl mx-auto mt-6 dark:bg-gray-900">
			<CardHeader>
				<CardTitle>Formulario de tarea con IA</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<Input
					placeholder="Título de la tarea"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
				<Textarea
					placeholder="Descripción detallada de la tarea"
					rows={4}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>
				<Button onClick={handleImprove} disabled={loading}>
					{loading ? "Mejorando..." : "Mejorar con IA"}
				</Button>

				{improvedText && (
					<div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line mt-4 border dark:border-gray-700">
						<strong className="block mb-1">Sugerencia mejorada:</strong>
						{improvedText}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
