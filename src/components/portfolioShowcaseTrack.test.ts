import { describe, expect, it } from "vitest";
import { resolveStoryTrack } from "@/components/portfolioShowcaseTrack";

describe("resolveStoryTrack", () => {
    it("prefers the first explicit Strapi category over inferred keywords", () => {
        const track = resolveStoryTrack(
            ["Destination", "Travel / Adventure"],
            "Your room has no walls - just the desert",
            "A desert camp stay that feels far from everything.",
            "",
            "",
        );

        expect(track).toBe("Destination");
    });

    it("returns the first non-empty trimmed category", () => {
        const track = resolveStoryTrack(["", "  Nature  ", "Travel / Adventure"], "", "", "", "");

        expect(track).toBe("Nature");
    });

    it("falls back to keyword-based inference when categories are missing", () => {
        const track = resolveStoryTrack(
            [],
            "Sunset suite tour",
            "Hotel room walkthrough with spa access",
            "",
            "",
        );

        expect(track).toBe("Hotels & Resorts");
    });

    it("returns an empty string when there is no category and no keyword match", () => {
        const track = resolveStoryTrack([], "Untitled", "Generic content", "", "");

        expect(track).toBe("");
    });
});
