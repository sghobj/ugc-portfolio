import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    createUgcAdminClient,
    uploadStrapiMediaFile,
    type UgcAdminClient,
} from "@/lib/ugcAdminApi";

type CreateClientDialogProps = {
    token: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (client: UgcAdminClient) => void;
    onError?: (message: string) => void;
};

type ClientFormState = {
    name: string;
    location: string;
    contactName: string;
    email: string;
    phone: string;
    website: string;
    instagram: string;
    notes: string;
};

const emptyClient: ClientFormState = {
    name: "",
    location: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    instagram: "",
    notes: "",
};

const inputClass =
    "w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-800";
const labelClass = "block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1";

export const CreateClientDialog = ({
    token,
    open,
    onOpenChange,
    onCreated,
    onError,
}: CreateClientDialogProps) => {
    const [form, setForm] = useState<ClientFormState>(emptyClient);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const set = (key: keyof ClientFormState, value: string) =>
        setForm((current) => ({ ...current, [key]: value }));

    const reset = () => {
        setForm(emptyClient);
        setLogoFile(null);
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim()) {
            onError?.("A client name is required.");
            return;
        }

        setSaving(true);
        try {
            let logoFileId: number | undefined;
            if (logoFile) {
                try {
                    logoFileId = (await uploadStrapiMediaFile(token, logoFile)).id;
                } catch (uploadError) {
                    onError?.(
                        `Client will be created, but the logo upload failed (add it in Strapi): ${
                            uploadError instanceof Error ? uploadError.message : "unknown error"
                        }`,
                    );
                }
            }

            const created = await createUgcAdminClient(token, {
                name: form.name.trim(),
                location: form.location.trim() || undefined,
                contactName: form.contactName.trim() || undefined,
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                website: form.website.trim() || undefined,
                instagram: form.instagram.trim() || undefined,
                notes: form.notes.trim() || undefined,
                logoFileId,
            });

            onCreated(created);
            reset();
            onOpenChange(false);
        } catch (error) {
            onError?.(error instanceof Error ? error.message : "Failed to create client.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader className="sticky -top-6 -mx-6 -mt-6 border-b border-neutral-200 bg-white px-6 pb-4 pt-6">
                    <DialogTitle className="font-display text-2xl italic">New client</DialogTitle>
                    <DialogDescription>
                        Create a client here to attach it to previews (and reuse it later).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Name *</label>
                            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Belvedere Hotel" />
                        </div>
                        <div>
                            <label className={labelClass}>Location</label>
                            <input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Ksamil, Albania" />
                        </div>
                        <div>
                            <label className={labelClass}>Contact name</label>
                            <input className={inputClass} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Ana" />
                        </div>
                        <div>
                            <label className={labelClass}>Email</label>
                            <input className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="hello@belvedere.al" />
                        </div>
                        <div>
                            <label className={labelClass}>Phone</label>
                            <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Website</label>
                            <input className={inputClass} value={form.website} onChange={(e) => set("website", e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Instagram</label>
                            <input className={inputClass} value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@belvedere" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Notes</label>
                            <textarea className={`${inputClass} min-h-16`} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Logo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                                className="w-full text-sm text-neutral-700"
                            />
                        </div>
                    </div>

                    <div className="sticky -bottom-6 -mx-6 -mb-6 flex items-center justify-end gap-3 border-t border-neutral-200 bg-white px-6 py-3">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="rounded border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                        >
                            {saving ? "Creating…" : "Create client"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateClientDialog;
