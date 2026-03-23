import { useEffect, useState } from "react";

const useTheme = () => {
	const [theme, setTheme] = useState(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("theme") || "system";
		}
		return "system";
	});

    useEffect(() => {
        const root = document.documentElement;
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        
        let effectiveTheme = theme;
        if (theme === "system") {
            effectiveTheme = systemPrefersDark ? "dark" : "light";
        }
        
        root.classList.remove("light", "dark");
        root.classList.add(effectiveTheme);
        localStorage.setItem("theme", theme);
    }, [theme]);

	return { theme, setTheme };
};

export default useTheme;
