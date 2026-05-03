// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { impressum } from "@/content/impressum";
import ImpressumPage from "./Impressum";

describe("ImpressumPage", () => {
    it("renders the legal notice content and required contact details", () => {
        render(<ImpressumPage />);

        expect(screen.getByRole("heading", { name: "Impressum" })).toBeInTheDocument();
        expect(screen.getByText(impressum.legalReference)).toBeInTheDocument();
        expect(screen.getByText("Esslingen, Germany")).toBeInTheDocument();
        expect(screen.queryByText("Kleinunternehmen (Gewerbeanmeldung vorhanden).")).not.toBeInTheDocument();
        const editorialSection = screen.getByText("Editorial Responsibility").parentElement as HTMLElement;
        expect(editorialSection).toHaveTextContent(impressum.editorialResponsible);
        expect(editorialSection).toHaveTextContent(impressum.editorialScope);
        expect(screen.queryByText(/VAT \/ Register/i)).not.toBeInTheDocument();

        const emailLinks = screen.getAllByRole("link", { name: impressum.contactEmail });
        expect(emailLinks.length).toBeGreaterThan(0);
        expect(emailLinks[0].parentElement).toHaveClass("flex", "flex-col");

        emailLinks.forEach((link) => {
            expect(link).toHaveAttribute("href", `mailto:${impressum.contactEmail}`);
        });

        expect(screen.getByRole("link", { name: impressum.instagramHandle })).toHaveAttribute(
            "href",
            impressum.instagramUrl,
        );
    });
});
