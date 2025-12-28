import axios from "axios";

// 1. Creamos la instancia con la URL base
const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:3000",
    withCredentials: true, // Mantenemos esto por si alguna vez usas cookies
});

// 2. INTERCEPTOR DE PETICIÓN: Se ejecuta ANTES de que la petición salga
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        // Inyectamos el Bearer Token automáticamente
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. INTERCEPTOR DE RESPUESTA: Se ejecuta CUANDO llega la respuesta
api.interceptors.response.use(
    (response) => response, // Si todo sale bien, pasamos la respuesta
    (error) => {
        // Si el servidor responde 401 (No autorizado), limpiamos el token
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            // Opcional: podrías redirigir al login aquí si no estás ya en él
            // window.location.href = "/auth";
        }
        return Promise.reject(error);
    }
);

export default api;