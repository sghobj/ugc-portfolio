export type Brand = {
    /** Brand / property name. */
    name: string;
    /** City / region shown under the name. */
    location: string;
    /**
     * Optional logo. Drop a file in /public/brands (e.g. "/brands/belvedere229.png")
     * or paste a Cloudinary URL. When empty, the name is rendered as an elegant
     * typographic wordmark instead.
     */
    logoUrl?: string;
    /** Optional link to the brand's site or the related collaboration. */
    url?: string;
};

/**
 * Real collaborations only — brands Sarah has genuinely created content for.
 * Self-paid portfolio shoots are intentionally excluded so this reads as an
 * honest client list. Add new collabs here as they close.
 */
export const brands: Brand[] = [
    {
        name: "Belvedere229 Luxury Apartments",
        location: "Lago Maggiore, Italy",
        logoUrl: "",
        url: "",
    },
    {
        name: "Prinz-Luitpold-Bad",
        location: "Allgäu, Germany",
        logoUrl: "",
        url: "",
    },
];
