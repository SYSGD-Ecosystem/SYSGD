import { useState, useEffect } from "react";
import api from "@/lib/api";

interface User {
    id: string;
    name: string;
    email: string;
    privileges: string;
}

const useCurrentUser = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get<User>("/api/auth/me");
                
                const userData = res.data;

                if (userData && userData.privileges === null) {
                    userData.privileges = "user";
                }

                setUser(userData);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return { user, loading };
};

export default useCurrentUser;