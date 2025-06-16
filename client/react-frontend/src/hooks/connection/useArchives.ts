import { useState, useEffect } from "react";

const useArchives = () => {
  const [archives, setArchives] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          localStorage.server + "/api.php?action=archives"
        );
        if (!response.ok) {
          throw new Error("Error al obtener los datos");
        }
        const data = await response.json();
        setArchives(data);
        setLoading(false);
      } catch (error) {
        setError(JSON.stringify(error));
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { archives, error, loading };
};

export default useArchives;
