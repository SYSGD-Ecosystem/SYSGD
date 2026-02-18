import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { User } from "@/types/user";
import { readCachedUser, writeCachedUser } from "@/utils/offline-access";

type CurrentUserResponse = Omit<User, "privileges"> & {
	privileges: User["privileges"] | null;
};

const useCurrentUser = () => {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const res = await api.get<CurrentUserResponse>("/api/auth/me");

				console.log("Respuesta de /api/auth/me:", res);

				const userData: User = {
					...res.data,
					privileges: res.data.privileges ?? "user",
				};

				setUser(userData);
				writeCachedUser(userData);
				setIsAuthenticated(true);
			} catch {
				const token = localStorage.getItem("token");
				const cachedUser = readCachedUser();
				if (token && cachedUser) {
					setUser(cachedUser);
					setIsAuthenticated(true);
				} else {
					setUser(null);
					setIsAuthenticated(false);
				}
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, []);

	return { user, isAuthenticated, loading };
};

export default useCurrentUser;
