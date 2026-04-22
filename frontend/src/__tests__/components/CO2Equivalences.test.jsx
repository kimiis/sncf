import { render, screen, act } from "@testing-library/react";
import CO2Equivalences from "../../components/CO2Equivalences";

// On neutralise les icônes react-icons pour simplifier les snapshots
jest.mock("react-icons/fa", () => ({
    FaTree: () => <span>tree</span>,
    FaCar: () => <span>car</span>,
    FaFire: () => <span>fire</span>,
    FaMobileAlt: () => <span>mobile</span>,
    FaLeaf: () => <span>leaf</span>,
}));

describe("CO2Equivalences", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test("ne rend rien si co2SavedKg est 0", () => {
        const { container } = render(<CO2Equivalences co2SavedKg={0} />);
        expect(container.firstChild).toBeNull();
    });

    test("ne rend rien si co2SavedKg est négatif", () => {
        const { container } = render(<CO2Equivalences co2SavedKg={-5} />);
        expect(container.firstChild).toBeNull();
    });

    test("ne rend rien si co2SavedKg est undefined", () => {
        const { container } = render(<CO2Equivalences />);
        expect(container.firstChild).toBeNull();
    });

    test("affiche la valeur CO₂ arrondie à 1 décimale", () => {
        render(<CO2Equivalences co2SavedKg={42.567} />);
        expect(screen.getByText(/42\.6 kg de CO/)).toBeInTheDocument();
    });

    test("affiche les 4 cartes d'équivalences", () => {
        render(<CO2Equivalences co2SavedKg={10} />);
        expect(screen.getByText("arbres plantés")).toBeInTheDocument();
        expect(screen.getByText("km de voiture évités")).toBeInTheDocument();
        expect(screen.getByText("jours de chauffage évités")).toBeInTheDocument();
        expect(screen.getByText("charges de smartphone")).toBeInTheDocument();
    });

    test("calcule correctement les km de voiture (co2 / 0.122)", () => {
        render(<CO2Equivalences co2SavedKg={12.2} />);
        // 12.2 / 0.122 = 100 → affiché "100 km"
        expect(screen.getByText(/100 km/)).toBeInTheDocument();
    });

    test("calcule correctement les arbres plantés (co2 / 21)", () => {
        render(<CO2Equivalences co2SavedKg={21} />);
        // 21 / 21 = 1 → affiché "1.0" (< 10, 1 décimale)
        expect(screen.getByText("1.0")).toBeInTheDocument();
    });

    test("affiche la valeur arrondie à l'entier si >= 10", () => {
        render(<CO2Equivalences co2SavedKg={100} />);
        // 100 / 0.122 = ~819.67 → Math.round = 820
        expect(screen.getByText(/820 km/)).toBeInTheDocument();
    });

    test("la section devient visible après le timer de 200ms", () => {
        const { container } = render(<CO2Equivalences co2SavedKg={10} />);
        const section = container.querySelector(".co2-equiv-section");

        expect(section).not.toHaveClass("co2-visible");

        act(() => jest.advanceTimersByTime(200));

        expect(section).toHaveClass("co2-visible");
    });
});
