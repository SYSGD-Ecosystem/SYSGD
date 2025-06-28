import { useState, useEffect } from "react";

const useGetData = (code: string) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!code) {
          throw new Error("El código no puede estar vacío.");
        }

        const response = await fetch(`${serverUrl}/api/get_data?code=${encodeURIComponent(code)}`, {
          credentials: "include", // 👈 importante para sesiones
        });

        if (!response.ok) {
          throw new Error("Error al obtener los datos");
        }

        const data = await response.json();
        setData(data);
        setError(null);
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code, serverUrl]);

  return { data, error, loading };
};

export default useGetData;
