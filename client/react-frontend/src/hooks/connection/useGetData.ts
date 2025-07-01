import { useState, useEffect } from "react";

const useGetData = (id: string) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          throw new Error("El código no puede estar vacío.");
        }

        const response = await fetch(`${serverUrl}/api/get_data?id=${encodeURIComponent(id)}`, {
          credentials: "include",
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
  }, [id, serverUrl]);

  return { data, error, loading };
};

export default useGetData;
