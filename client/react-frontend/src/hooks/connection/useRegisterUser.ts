import { useState } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";


interface RegisterData {
  name: string;
  username: string;
  password: string;
}

interface RegisterResult {
  register: (data: RegisterData) => Promise<void>;
  loading: boolean;
  error: string;
  success: boolean;
}

export function useRegisterUser(): RegisterResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const register = async ({ name, username, password }: RegisterData) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`${serverUrl}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, username, password }),
      });

      if (res.status === 201) {
        setSuccess(true);
      } else if (res.status === 400) {
        setError("Faltan datos obligatorios.");
      } else if (res.status === 409) {
        setError("El usuario ya existe.");
      } else {
        setError("Error desconocido del servidor.");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error, success };
}
