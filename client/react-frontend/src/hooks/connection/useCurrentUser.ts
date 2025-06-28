import { useState, useEffect } from "react";

const useCurrentUser = () => {
  const [user, setUser] = useState<null | {
    id: number;
    name: string;
    username: string;
    privileges: string;
  }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_SERVER_URL}/api/me`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("No autenticado");
        const data = await res.json();
        setUser(data);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if(user?.privileges===null){
    user.privileges="user"
  }
  return { user, loading };
};

export default useCurrentUser;
