import { render, screen } from "@testing-library/react";
import React from "react";
import * as useAuthModule from "../../hooks/useAuth";

// Mock complet de react-router-dom pour éviter les dépendances navigateur de v7
jest.mock("react-router-dom", () => ({
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
    Outlet: () => <div data-testid="outlet">Contenu protégé</div>,
    useLocation: () => ({ pathname: "/" }),
}));

jest.mock("../../hooks/useAuth");

import PrivateRoute from "../../components/PrivateRoute";

function renderPrivateRoute(authState, roles = []) {
    useAuthModule.useAuth.mockReturnValue(authState);
    return render(<PrivateRoute roles={roles} />);
}

describe("PrivateRoute", () => {
    beforeEach(() => jest.clearAllMocks());

    test("affiche le contenu (Outlet) si l'utilisateur est authentifié", () => {
        renderPrivateRoute({ isAuthenticated: true, role: "user" });
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });

    test("redirige vers /login si l'utilisateur n'est pas authentifié", () => {
        renderPrivateRoute({ isAuthenticated: false, role: null });
        const nav = screen.getByTestId("navigate");
        expect(nav).toBeInTheDocument();
        expect(nav).toHaveAttribute("data-to", "/login");
    });

    test("affiche le contenu si le rôle correspond à la liste des rôles autorisés", () => {
        renderPrivateRoute({ isAuthenticated: true, role: "admin" }, ["admin"]);
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });

    test("redirige vers /unauthorized si le rôle ne correspond pas", () => {
        renderPrivateRoute({ isAuthenticated: true, role: "user" }, ["admin"]);
        const nav = screen.getByTestId("navigate");
        expect(nav).toHaveAttribute("data-to", "/unauthorized");
    });

    test("affiche le contenu si aucun rôle n'est requis (tableau vide)", () => {
        renderPrivateRoute({ isAuthenticated: true, role: "user" }, []);
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });

    test("accepte plusieurs rôles autorisés", () => {
        renderPrivateRoute({ isAuthenticated: true, role: "moderator" }, ["admin", "moderator"]);
        expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });
});
