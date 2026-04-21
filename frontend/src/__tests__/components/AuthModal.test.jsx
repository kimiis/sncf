import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthModal from "../../components/AuthModal";
import apiModule from "../../api/axios";
const api = apiModule.default || apiModule;

// Mock de l'API axios avec factory explicite pour éviter le chargement du module ESM
jest.mock("../../api/axios", () => {
    const mock = {
        post: jest.fn(),
        get: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    };
    return { __esModule: true, default: mock };
});
// Mock de l'image
jest.mock("../../assets/montagnes-ss-bg.png", () => "montagnes.png");

// Mock de alert pour éviter les erreurs jsdom
global.alert = jest.fn();

describe("AuthModal", () => {
    const onClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    // ─── Rendu conditionnel ─────────────────────────────────────────────────

    test("ne rend rien si isOpen=false", () => {
        const { container } = render(<AuthModal isOpen={false} onClose={onClose} />);
        expect(container.firstChild).toBeNull();
    });

    test("rend la modal si isOpen=true", () => {
        render(<AuthModal isOpen={true} onClose={onClose} />);
        expect(screen.getByRole("heading", { name: /se connecter/i })).toBeInTheDocument();
    });

    // ─── Mode login ─────────────────────────────────────────────────────────

    test("affiche le formulaire de connexion par défaut", () => {
        render(<AuthModal isOpen={true} onClose={onClose} />);
        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Mot de passe")).toBeInTheDocument();
        expect(screen.queryByPlaceholderText("Nom")).not.toBeInTheDocument();
    });

    test("connexion réussie — stocke le token et ferme la modal", async () => {
        api.post.mockResolvedValue({ data: { token: "fake.jwt.token" } });

        render(<AuthModal isOpen={true} onClose={onClose} />);

        await userEvent.type(screen.getByPlaceholderText("Email"), "alice@example.com");
        await userEvent.type(screen.getByPlaceholderText("Mot de passe"), "password123");
        fireEvent.submit(screen.getByRole("button", { name: /se connecter/i }));

        await waitFor(() => {
            expect(localStorage.getItem("token")).toBe("fake.jwt.token");
            expect(onClose).toHaveBeenCalled();
        });
    });

    test("connexion échouée — affiche une alerte d'erreur", async () => {
        api.post.mockRejectedValue({
            response: { data: { message: "Mot de passe incorrect." } },
        });

        render(<AuthModal isOpen={true} onClose={onClose} />);
        await userEvent.type(screen.getByPlaceholderText("Email"), "a@b.com");
        await userEvent.type(screen.getByPlaceholderText("Mot de passe"), "mauvais");
        fireEvent.submit(screen.getByRole("button", { name: /se connecter/i }));

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith("Mot de passe incorrect.");
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    // ─── Passage en mode inscription ────────────────────────────────────────

    test("bascule en mode inscription en cliquant sur 'S'inscrire'", async () => {
        render(<AuthModal isOpen={true} onClose={onClose} />);
        await userEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

        expect(screen.getByRole("heading", { name: /inscription/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Nom")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Prénom")).toBeInTheDocument();
    });

    // ─── Mode inscription ────────────────────────────────────────────────────

    test("inscription réussie — revient en mode login", async () => {
        render(<AuthModal isOpen={true} onClose={onClose} />);

        // Passer en mode inscription
        await userEvent.click(screen.getByRole("button", { name: /s'inscrire/i }));

        api.post.mockResolvedValue({ data: {} });

        await userEvent.type(screen.getByPlaceholderText("Nom"), "Dupont");
        await userEvent.type(screen.getByPlaceholderText("Prénom"), "Alice");
        await userEvent.type(screen.getByPlaceholderText("Email"), "alice@example.com");
        await userEvent.type(screen.getByPlaceholderText("Mot de passe"), "secret123");
        fireEvent.submit(screen.getByRole("button", { name: /s'inscrire/i }));

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /se connecter/i })).toBeInTheDocument();
        });
    });

    // ─── Fermeture ───────────────────────────────────────────────────────────

    test("ferme la modal en cliquant sur l'overlay", async () => {
        render(<AuthModal isOpen={true} onClose={onClose} />);
        await userEvent.click(document.querySelector(".auth-modal-overlay"));
        expect(onClose).toHaveBeenCalled();
    });

    test("ne ferme pas la modal en cliquant à l'intérieur", async () => {
        render(<AuthModal isOpen={true} onClose={onClose} />);
        await userEvent.click(document.querySelector(".auth-modal"));
        expect(onClose).not.toHaveBeenCalled();
    });
});
