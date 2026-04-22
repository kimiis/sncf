/**
 * Smoke test — vérifie que l'application se monte sans crash.
 * On mock les dépendances lourdes (router, contextes, etc.).
 */
import { render } from "@testing-library/react";
import React from "react";

// Mocks des modules qui nécessitent un env navigateur complet
jest.mock("react-router-dom", () => ({
    BrowserRouter: ({ children }) => <div>{children}</div>,
    Routes: ({ children }) => <div>{children}</div>,
    Route: () => null,
    Navigate: () => null,
    useLocation: () => ({ pathname: "/" }),
    useNavigate: () => jest.fn(),
    Outlet: () => null,
}));

jest.mock("./context/ThemeContext", () => ({
    ThemeProvider: ({ children }) => <div>{children}</div>,
    useTheme: () => ({ theme: "light", toggleTheme: jest.fn() }),
}));

// Mock de toutes les pages pour éviter des imports complexes
jest.mock("./pages/Home.jsx", () => () => <div>Home</div>);
jest.mock("./pages/Index.jsx", () => () => <div>Index</div>);
jest.mock("./pages/SearchResult.jsx", () => () => <div>Search</div>);
jest.mock("./pages/Profil.jsx", () => () => <div>Profil</div>);
jest.mock("./pages/Inspiration.jsx", () => () => <div>Inspiration</div>);
jest.mock("./pages/UnauthorizedPage.jsx", () => () => <div>Unauthorized</div>);
jest.mock("./components/PrivateRoute.jsx", () => ({ roles }) => <div>PrivateRoute</div>);
jest.mock("./components/NavBar.jsx", () => () => <div>NavBar</div>);

import App from "./App";

test("l'application se monte sans crash", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
});
