import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:3000",
	withCredentials: true,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			console.warn("No autorizado - quizás el token ha expirado", error);
		}
		return Promise.reject(error);
	},
);

export default api;
