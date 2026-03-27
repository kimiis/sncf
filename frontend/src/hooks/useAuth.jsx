import { jwtDecode } from "jwt-decode";

export const useAuth = () => {
    const token = localStorage.getItem("token");

    if (!token) return { isAuthenticated: false, id: null, role: null };

    try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
        if (isExpired) {
            localStorage.removeItem("token");
            return { isAuthenticated: false, id: null, role: null };
        }
        return { isAuthenticated: true, id: decoded.id, role: decoded.role || null };
    } catch (err) {
        console.error("Erreur de décodage du token :", err);
        return { isAuthenticated: false, id: null, role: null };
    }
};
