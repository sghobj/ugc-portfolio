const TRACK_RULES: Array<{ label: string; keywords: string[] }> = [
    {
        label: "Hotels & Resorts",
        keywords: ["hotel", "resort", "hospitality", "suite", "stay", "spa", "amenity"],
    },
    {
        label: "Airlines & Transit",
        keywords: ["airline", "flight", "airport", "cabin", "aviation", "lounge", "traveler"],
    },
    {
        label: "Destinations & Travel",
        keywords: ["travel", "destination", "tourism", "journey", "roadtrip", "adventure", "trip"],
    },
];

const firstDefinedCategory = (categories: string[]): string => {
    return categories.map((category) => category.trim()).find((category) => category.length > 0) ?? "";
};

export const resolveStoryTrack = (
    categories: string[],
    title: string,
    description: string,
    goal: string,
    style: string,
): string => {
    const explicitCategory = firstDefinedCategory(categories);

    if (explicitCategory) {
        return explicitCategory;
    }

    const searchSpace = [title, description, goal, style].join(" ").toLowerCase();

    for (const rule of TRACK_RULES) {
        if (rule.keywords.some((keyword) => searchSpace.includes(keyword))) {
            return rule.label;
        }
    }

    return "";
};
