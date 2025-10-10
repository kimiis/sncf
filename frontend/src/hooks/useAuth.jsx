import { jwtDecode } from "jwt-decode";

export const useAuth = () => {
    const token = localStorage.getItem("token");

    if (!token) return { isAuthenticated: false, id: null, role: null };

    try {
        const decoded = jwtDecode(token);
        return { isAuthenticated: true, id: decoded.id, role: decoded.role || null };
    } catch (err) {
        console.error("Erreur de décodage du token :", err);
        return { isAuthenticated: false, id: null, role: null };
    }
};
