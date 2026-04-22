import { useAuth } from "../../hooks/useAuth";
import { jwtDecode } from "jwt-decode";

// Mock jwt-decode
jest.mock("jwt-decode");

describe("useAuth", () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test("retourne isAuthenticated=false quand pas de token", () => {
        const result = useAuth();
        expect(result).toEqual({ isAuthenticated: false, id: null, role: null });
    });

    test("retourne isAuthenticated=true avec un token valide", () => {
        const futureExp = Math.floor(Date.now() / 1000) + 3600;
        jwtDecode.mockReturnValue({ id: "uuid-1", role: "user", exp: futureExp });
        localStorage.setItem("token", "valid.token.here");

        const result = useAuth();

        expect(result.isAuthenticated).toBe(true);
        expect(result.id).toBe("uuid-1");
        expect(result.role).toBe("user");
    });

    test("retourne isAuthenticated=false et supprime le token expiré", () => {
        const pastExp = Math.floor(Date.now() / 1000) - 1;
        jwtDecode.mockReturnValue({ id: "uuid-1", role: "user", exp: pastExp });
        localStorage.setItem("token", "expired.token");

        const result = useAuth();

        expect(result.isAuthenticated).toBe(false);
        expect(localStorage.getItem("token")).toBeNull();
    });

    test("retourne isAuthenticated=false si le token est malformé", () => {
        jwtDecode.mockImplementation(() => { throw new Error("Invalid token"); });
        localStorage.setItem("token", "bad.token");

        const result = useAuth();

        expect(result.isAuthenticated).toBe(false);
        expect(result.id).toBeNull();
    });

    test("retourne role=null si le token ne contient pas de role", () => {
        const futureExp = Math.floor(Date.now() / 1000) + 3600;
        jwtDecode.mockReturnValue({ id: "uuid-2", exp: futureExp });
        localStorage.setItem("token", "token.without.role");

        const result = useAuth();

        expect(result.isAuthenticated).toBe(true);
        expect(result.role).toBeNull();
    });

    test("retourne isAuthenticated=true si pas de champ exp (pas d'expiration)", () => {
        jwtDecode.mockReturnValue({ id: "uuid-3", role: "admin" });
        localStorage.setItem("token", "no.exp.token");

        const result = useAuth();

        expect(result.isAuthenticated).toBe(true);
        expect(result.role).toBe("admin");
    });
});
