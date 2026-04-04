import { env } from "@/config/env";

type ServiceInquiryPayload = {
    service: string;
    name: string;
    email: string;
    company: string;
    budget: string;
    timeline: string;
    message: string;
    website?: string;
    pageUrl?: string;
};

const MAX_SERVICE_LENGTH = 140;
const MAX_NAME_LENGTH = 90;
const MAX_EMAIL_LENGTH = 180;
const MAX_COMPANY_LENGTH = 140;
const MAX_BUDGET_LENGTH = 80;
const MAX_TIMELINE_LENGTH = 140;
const MAX_MESSAGE_LENGTH = 2500;
const MIN_MESSAGE_LENGTH = 20;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const sanitizeText = (value: string): string => value.replace(/\s+/g, " ").trim();
const sanitizeMultilineText = (value: string): string => value.replace(/\r\n/g, "\n").trim();

const parseApiErrorMessage = async (response: Response): Promise<string> => {
    try {
        const payload = (await response.json()) as
            | {
                  error?: { message?: string } | string;
                  message?: string;
              }
            | undefined;

        if (typeof payload?.error === "string" && payload.error) {
            return payload.error;
        }

        if (payload?.error && typeof payload.error === "object" && payload.error.message) {
            return payload.error.message;
        }

        if (payload?.message) {
            return payload.message;
        }
    } catch {
        // Ignore parsing errors and return fallback.
    }

    return `Request failed (${response.status})`;
};

const getServiceInquirySubmitUrl = (): string => {
    if (env.serviceInquirySubmitUrl) {
        return env.serviceInquirySubmitUrl;
    }

    if (env.backendMode === "strapi") {
        const baseUrl = getBaseUrl(env.strapiBaseUrl);
        return baseUrl ? `${baseUrl}/api/service-inquiry/submit` : "";
    }

    if (env.backendMode === "custom") {
        const baseUrl = getBaseUrl(env.customApiBaseUrl);
        return baseUrl ? `${baseUrl}/service-inquiry/submit` : "";
    }

    return "";
};

const toPayload = (input: ServiceInquiryPayload): ServiceInquiryPayload => ({
    service: sanitizeText(asString(input.service)),
    name: sanitizeText(asString(input.name)),
    email: sanitizeText(asString(input.email)).toLowerCase(),
    company: sanitizeText(asString(input.company)),
    budget: sanitizeText(asString(input.budget)),
    timeline: sanitizeText(asString(input.timeline)),
    message: sanitizeMultilineText(asString(input.message)),
    website: asString(input.website),
    pageUrl: sanitizeText(asString(input.pageUrl)),
});

const validatePayload = (payload: ServiceInquiryPayload): void => {
    if (!payload.service || payload.service.length < 2) {
        throw new Error("Please select a service.");
    }

    if (payload.service.length > MAX_SERVICE_LENGTH) {
        throw new Error(`Selected service is too long (max ${MAX_SERVICE_LENGTH} characters).`);
    }

    if (!payload.name || payload.name.length < 2) {
        throw new Error("Name is required.");
    }

    if (payload.name.length > MAX_NAME_LENGTH) {
        throw new Error(`Name is too long (max ${MAX_NAME_LENGTH} characters).`);
    }

    if (!payload.email) {
        throw new Error("Email is required.");
    }

    if (payload.email.length > MAX_EMAIL_LENGTH) {
        throw new Error(`Email is too long (max ${MAX_EMAIL_LENGTH} characters).`);
    }

    if (!EMAIL_REGEX.test(payload.email)) {
        throw new Error("Please provide a valid email address.");
    }

    if (payload.company.length > MAX_COMPANY_LENGTH) {
        throw new Error(`Company is too long (max ${MAX_COMPANY_LENGTH} characters).`);
    }

    if (payload.budget.length > MAX_BUDGET_LENGTH) {
        throw new Error(`Budget is too long (max ${MAX_BUDGET_LENGTH} characters).`);
    }

    if (payload.timeline.length > MAX_TIMELINE_LENGTH) {
        throw new Error(`Timeline is too long (max ${MAX_TIMELINE_LENGTH} characters).`);
    }

    if (!payload.message || payload.message.length < MIN_MESSAGE_LENGTH) {
        throw new Error(`Message is too short (min ${MIN_MESSAGE_LENGTH} characters).`);
    }

    if (payload.message.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`);
    }
};

export const submitServiceInquiry = async (input: ServiceInquiryPayload): Promise<void> => {
    const payload = toPayload(input);
    validatePayload(payload);

    const endpoint = getServiceInquirySubmitUrl();
    if (!endpoint) {
        throw new Error("Service inquiry endpoint is not configured.");
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body:
            env.backendMode === "strapi"
                ? JSON.stringify({ data: payload })
                : JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await parseApiErrorMessage(response));
    }
};

export type { ServiceInquiryPayload };
