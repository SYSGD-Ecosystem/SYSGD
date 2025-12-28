import { useState } from "react";
import api from "@/lib/api";
import axios from "axios";

interface LoginData {
    email: string;
    password: string;
}

interface LoginResult {
    login: (data: LoginData) => Promise<void>;
    loading: boolean;
    error: string;
    success: boolean;
}

export function useLogin(): LoginResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const login = async ({ email, password }: LoginData) => {
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const res = await api.post("/api/auth/login", { email, password });

            const { token } = res.data;

            if (token) {
                localStorage.setItem("token", token);
            }

            setSuccess(true);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                const message = err.response.data?.message;

                switch (status) {
                    case 400: setError("Faltan datos obligatorios."); break;
                    case 401: setError("El usuario no existe."); break;
                    case 402: setError("Contraseña Incorrecta."); break;
                    default: setError(message || "Error del servidor.");
                }
            } else {
                setError("No se pudo conectar con el servidor.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, error, success };
}