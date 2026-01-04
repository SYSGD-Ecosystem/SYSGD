import { useEffect, useState } from "react";
import api from "@/lib/api";

interface User {
	id: string;
	name: string;
	email: string;
	privileges: string;
}

const useCurrentUser = () => {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const res = await api.get<User>("/api/auth/me");

				console.log("Respuesta de /api/auth/me:", res);

				const userData = res.data;

				if (userData && userData.privileges === null) {
					userData.privileges = "user";
				}

				setUser(userData);
				setIsAuthenticated(true);
			} catch {
				setUser(null);
				setIsAuthenticated(false);
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, []);

	return { user, isAuthenticated, loading };
};

export default useCurrentUser;
