import { useState, useEffect } from "react";

const useGetData = (id: string) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Concaternar de forma adecuada
        const url = localStorage.server + "/api.php?action=get_data&id=" + id;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Error obtain data");
        }
        const data = await response.json();
        setData(data);
        setError(null);
        setLoading(false);
      } catch (error) {
        console.error(error)
        setError("500");
        setLoading(false);
      }
    };

    if (id !== "") {
      fetchData();
    } else {
      console.error("The code cannot be empty");
      setError("The code cannot be empty");
    }
  }, [id]);

  return { data, error, loading };
};

export default useGetData;
