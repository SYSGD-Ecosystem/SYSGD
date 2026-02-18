import { useState } from "react";
import api from "@/lib/api";

export const useGemini = () => {
    const [improvedText, setImprovedText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleImprove = async (
        title: string,
        description: string,
        // Añadimos el contexto del proyecto como parámetros opcionales
        projectContext?: { name: string; description: string },
        model?: string,
    ) => {
        setLoading(true);
        setImprovedText("");
        
        try {
            // Construimos un prompt mucho más rico en información
            const contextPrompt = projectContext 
                ? `Contexto del Proyecto:\n- Nombre: ${projectContext.name}\n- Descripción del Proyecto: ${projectContext.description}\n\n`
                : "";

            const finalPrompt = `${contextPrompt}Por favor, mejora y clarifica el siguiente Título y Descripción de una TAREA dentro de este proyecto. Asegúrate de que sea profesional y fácil de entender para el equipo.\n\nTítulo de la Tarea: ${title}\nDescripción actual: ${description}`;

            const response = await api.post<{ respuesta: string }>("/api/generate", {
                prompt: finalPrompt,
                model: model || "gemini-2.5-flash",
            });

            setImprovedText(response.data.respuesta || "No se recibió texto.");
        } catch (err: any) {
            console.error("Error al llamar a la IA:", err);
            setImprovedText("⚠️ Error al conectar con la IA");
        } finally {
            setLoading(false);
        }
    };

    return { improvedText, loading, handleImprove };
};