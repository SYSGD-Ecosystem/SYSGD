import { useEffect, useState } from "react";

const useTheme = () => {
	const [theme, setTheme] = useState("");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "system";
        // setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    useEffect(() => {
        if (theme) {
            localStorage.setItem("theme", theme);
            document.documentElement.setAttribute("data-theme", theme);
        }
    }, [theme]);

	return { theme, setTheme };
};

export default useTheme;
