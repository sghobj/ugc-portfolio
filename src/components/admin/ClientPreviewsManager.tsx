import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bold, Italic, List } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    createUgcAdminPreview,
    deleteUgcAdminPreview,
    listUgcAdminClients,
    listUgcAdminPreviews,
    updateUgcAdminPreview,
    uploadAndCreateAsset,
    type UgcAdminAsset,
    type UgcAdminClient,
    type UgcAdminPreview,
    type UgcAdminPreviewInput,
} from "@/lib/ugcAdminApi";
import CreateClientDialog from "@/components/admin/CreateClientDialog";

type ClientPreviewsManagerProps = {
    token: string;
    assets: UgcAdminAsset[];
    onMessage?: (message: string) => void;
    onError?: (message: string) => void;
    onRefreshAssets?: () => void | Promise<void>;
};

type FormState = {
    title: string;
    clientId: number | null;
    expiresAtLocal: string;
    accessCode: string;
    ctaEmail: string;
    intro: string;
    offer: string;
    isActive: boolean;
    assetIds: number[];
    shareId: string;
};

const emptyForm: FormState = {
    title: "",
    clientId: null,
    expiresAtLocal: "",
    accessCode: "",
    ctaEmail: "",
    intro: "",
    offer: "",
    isActive: true,
    assetIds: [],
    shareId: "",
};

const slugifyPreview = (value: string): string =>
    value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

/** Wraps the current textarea selection with a marker (e.g. ** for bold). Falls back to placeholder text if nothing is selected. */
const wrapSelection = (
    textarea: HTMLTextAreaElement | null,
    value: string,
    onChange: (next: string) => void,
    marker: string,
    placeholder: string,
) => {
    if (!textarea) return;
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || placeholder;
    const next = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
};

/** Prefixes each selected line with "- " to turn it into a markdown bullet list. */
const insertBulletList = (
    textarea: HTMLTextAreaElement | null,
    value: string,
    onChange: (next: string) => void,
) => {
    if (!textarea) return;
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || "List item";
    const bulleted = selected
        .split("\n")
        .map((line) => (line.trim().length > 0 ? `- ${line.replace(/^-\s*/, "")}` : line))
        .join("\n");
    const next = `${value.slice(0, start)}${bulleted}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + bulleted.length);
    });
};

const toolbarButtonClass =
    "grid h-7 w-7 place-items-center rounded border border-neutral-300 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900";

const FormatToolbar = ({
    textarea,
    value,
    onChange,
}: {
    textarea: HTMLTextAreaElement | null;
    value: string;
    onChange: (next: string) => void;
}) => (
    <div className="flex items-center gap-1">
        <button
            type="button"
            title="Bold"
            aria-label="Bold"
            onClick={() => wrapSelection(textarea, value, onChange, "**", "bold text")}
            className={toolbarButtonClass}
        >
            <Bold className="h-3.5 w-3.5" />
        </button>
        <button
            type="button"
            title="Italic"
            aria-label="Italic"
            onClick={() => wrapSelection(textarea, value, onChange, "*", "italic text")}
            className={toolbarButtonClass}
        >
            <Italic className="h-3.5 w-3.5" />
        </button>
        <button
            type="button"
            title="Bullet list"
            aria-label="Bullet list"
            onClick={() => insertBulletList(textarea, value, onChange)}
            className={toolbarButtonClass}
        >
            <List className="h-3.5 w-3.5" />
        </button>
    </div>
);

const pad = (value: number): string => String(value).padStart(2, "0");

const toLocalInput = (iso?: string | null): string => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromLocalInput = (local: string): string => {
    if (!local) return "";
    const date = new Date(local);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const defaultExpiryLocal = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return toLocalInput(date.toISOString());
};

const assetThumb = (asset: UgcAdminAsset): string =>
    asset.thumbnailUrl ||
    asset.cloudinary?.thumbnailUrl ||
    asset.bunny?.thumbnailUrl ||
    asset.cloudinary?.secureUrl ||
    asset.secureUrl ||
    "";

const inputClass =
    "w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-800";
const labelClass = "block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1";

const ClientPreviewsManager = ({
    token,
    assets,
    onMessage,
    onError,
    onRefreshAssets,
}: ClientPreviewsManagerProps) => {
    const [previews, setPreviews] = useState<UgcAdminPreview[]>([]);
    const [clients, setClients] = useState<UgcAdminClient[]>([]);
    const [localAssets, setLocalAssets] = useState<UgcAdminAsset[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | "new" | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [assetFilter, setAssetFilter] = useState("");
    const [clientDialogOpen, setClientDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<UgcAdminPreview | null>(null);
    const introRef = useRef<HTMLTextAreaElement>(null);
    const offerRef = useRef<HTMLTextAreaElement>(null);

    const notify = useCallback((msg: string) => onMessage?.(msg), [onMessage]);
    const fail = useCallback((msg: string) => onError?.(msg), [onError]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [previewRows, clientRows] = await Promise.all([
                listUgcAdminPreviews(token),
                listUgcAdminClients(token),
            ]);
            setPreviews(previewRows);
            setClients(clientRows);
        } catch (error) {
            fail(error instanceof Error ? error.message : "Failed to load previews.");
        } finally {
            setLoading(false);
        }
    }, [token, fail]);

    useEffect(() => {
        void load();
    }, [load]);

    const allAssets = useMemo(() => {
        const map = new Map<number, UgcAdminAsset>();
        for (const asset of assets) map.set(asset.id, asset);
        for (const asset of localAssets) map.set(asset.id, asset);
        return Array.from(map.values());
    }, [assets, localAssets]);

    const filteredAssets = useMemo(() => {
        const term = assetFilter.trim().toLowerCase();
        if (!term) return allAssets;
        return allAssets.filter((asset) =>
            `${asset.title} ${asset.kind} ${asset.hook ?? ""}`.toLowerCase().includes(term),
        );
    }, [allAssets, assetFilter]);

    const clientNameById = useMemo(() => {
        const map = new Map<number, string>();
        for (const client of clients) {
            map.set(client.id, client.name);
        }
        return map;
    }, [clients]);

    const startNew = () => {
        setForm({ ...emptyForm, expiresAtLocal: defaultExpiryLocal() });
        setEditingId("new");
    };

    const startEdit = (preview: UgcAdminPreview) => {
        setForm({
            title: preview.title,
            clientId: preview.clientId ?? null,
            expiresAtLocal: toLocalInput(preview.expiresAt),
            accessCode: preview.accessCode ?? "",
            ctaEmail: preview.ctaEmail ?? "",
            intro: preview.intro ?? "",
            offer: preview.offer ?? "",
            isActive: preview.isActive,
            assetIds: [...preview.assetIds],
            shareId: preview.shareId ?? "",
        });
        setEditingId(preview.id);
    };

    const cancel = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const toggleAsset = (id: number) => {
        setForm((current) => ({
            ...current,
            assetIds: current.assetIds.includes(id)
                ? current.assetIds.filter((value) => value !== id)
                : [...current.assetIds, id],
        }));
    };

    const handleUploadToPreview = async (file: File | null) => {
        if (!file) return;
        const kind: "photo" | "video" = file.type.startsWith("video/") ? "video" : "photo";
        setUploading(true);
        setUploadProgress(kind === "video" ? 0 : null);
        try {
            const asset = await uploadAndCreateAsset(token, file, {
                title: file.name.replace(/\.[^.]+$/, ""),
                kind,
                visibility: "preview",
                uploadScope: "previews",
                onProgress: (ratio) => setUploadProgress(Math.round(ratio * 100)),
            });
            setLocalAssets((current) => [asset, ...current]);
            setForm((current) => ({ ...current, assetIds: [...current.assetIds, asset.id] }));
            notify(`Uploaded "${asset.title}" — private to this preview until released.`);
            void onRefreshAssets?.();
        } catch (error) {
            fail(error instanceof Error ? error.message : "Upload failed.");
        } finally {
            setUploading(false);
            setUploadProgress(null);
        }
    };

    const save = async () => {
        if (!form.title.trim()) {
            fail("Give the preview a title.");
            return;
        }
        if (!form.expiresAtLocal) {
            fail("Set an expiry date.");
            return;
        }

        const payload: UgcAdminPreviewInput = {
            title: form.title.trim(),
            clientId: form.clientId,
            clientName: form.clientId ? clientNameById.get(form.clientId) ?? "" : "",
            expiresAt: fromLocalInput(form.expiresAtLocal),
            accessCode: form.accessCode.trim(),
            ctaEmail: form.ctaEmail.trim(),
            intro: form.intro,
            offer: form.offer,
            isActive: form.isActive,
            assetIds: form.assetIds,
            shareId: form.shareId.trim(),
        };

        setSaving(true);
        try {
            if (editingId === "new") {
                await createUgcAdminPreview(token, payload);
                notify("Preview created.");
            } else if (typeof editingId === "number") {
                await updateUgcAdminPreview(token, editingId, payload);
                notify("Preview updated.");
            }
            cancel();
            await load();
        } catch (error) {
            fail(error instanceof Error ? error.message : "Failed to save preview.");
        } finally {
            setSaving(false);
        }
    };

    const performDelete = async (preview: UgcAdminPreview) => {
        setDeleteTarget(null);
        setBusyId(preview.id);
        try {
            await deleteUgcAdminPreview(token, preview.id);
            setPreviews((current) => current.filter((item) => item.id !== preview.id));
            if (editingId === preview.id) {
                cancel();
            }
            notify("Preview deleted.");
        } catch (error) {
            fail(error instanceof Error ? error.message : "Failed to delete preview.");
        } finally {
            setBusyId(null);
        }
    };

    const copyLink = async (preview: UgcAdminPreview) => {
        // Build from the current origin so the link matches where you're testing
        // (localhost while developing, your live domain in production).
        const url = preview.shareId
            ? `${window.location.origin}/preview/${preview.shareId}`
            : preview.previewUrl || "";
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            notify("Preview link copied.");
        } catch {
            fail("Couldn't copy — select the link and copy manually.");
        }
    };

    const handleClientCreated = (client: UgcAdminClient) => {
        setClients((current) => [...current, client].sort((a, b) => a.name.localeCompare(b.name)));
        setForm((current) => ({ ...current, clientId: client.id }));
        notify(`Client "${client.name}" created.`);
    };

    return (
        <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Client Previews</h2>
                    <p className="text-sm text-neutral-500">
                        Private, expiring sample links to send prospects. Manage everything here.
                    </p>
                </div>
                {editingId === null && (
                    <button
                        type="button"
                        onClick={startNew}
                        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        + New preview
                    </button>
                )}
            </div>

            {editingId !== null && (
                <div className="mb-6 rounded-lg border border-neutral-300 bg-white p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Title *</label>
                            <input
                                className={inputClass}
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Belvedere — Sample Work"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Client (watermark)</label>
                            <div className="flex gap-2">
                                <select
                                    className={inputClass}
                                    value={form.clientId ?? ""}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            clientId: e.target.value ? Number(e.target.value) : null,
                                        })
                                    }
                                >
                                    <option value="">— No client —</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                            {client.location ? ` · ${client.location}` : ""}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setClientDialogOpen(true)}
                                    className="shrink-0 rounded border border-neutral-300 px-3 text-sm text-neutral-700 hover:bg-neutral-100"
                                    title="Create a new client"
                                >
                                    + New
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Expires at *</label>
                            <input
                                type="datetime-local"
                                className={inputClass}
                                value={form.expiresAtLocal}
                                onChange={(e) => setForm({ ...form, expiresAtLocal: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Access code (PIN)</label>
                            <input
                                className={inputClass}
                                value={form.accessCode}
                                onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
                                placeholder="Leave blank for no PIN"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Notify email (for “I'm interested”)</label>
                            <input
                                className={inputClass}
                                value={form.ctaEmail}
                                onChange={(e) => setForm({ ...form, ctaEmail: e.target.value })}
                                placeholder="collabs@sarah-ghobj.com"
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm text-neutral-700">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                />
                                Active (link works)
                            </label>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>URL slug</label>
                            <input
                                className={inputClass}
                                value={form.shareId}
                                onChange={(e) => setForm({ ...form, shareId: slugifyPreview(e.target.value) })}
                                placeholder="belvedere-hotel-spa"
                            />
                            <p className="mt-1 truncate text-xs text-neutral-500">
                                ugc.sarah-ghobj.com/preview/
                                <span className="text-neutral-700">{form.shareId || "(leave blank for a random private link)"}</span>
                            </p>
                        </div>
                        <div className="sm:col-span-2">
                            <div className="mb-1 flex items-center justify-between">
                                <label className={labelClass}>Intro / pitch</label>
                                <FormatToolbar
                                    textarea={introRef.current}
                                    value={form.intro}
                                    onChange={(next) => setForm((current) => ({ ...current, intro: next }))}
                                />
                            </div>
                            <textarea
                                ref={introRef}
                                className={`${inputClass} min-h-48 resize-y`}
                                value={form.intro}
                                onChange={(e) => setForm({ ...form, intro: e.target.value })}
                                placeholder="A warm intro shown above the gallery…"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <div className="mb-1 flex items-center justify-between">
                                <label className={labelClass}>Offer / price</label>
                                <FormatToolbar
                                    textarea={offerRef.current}
                                    value={form.offer}
                                    onChange={(next) => setForm((current) => ({ ...current, offer: next }))}
                                />
                            </div>
                            <textarea
                                ref={offerRef}
                                className={`${inputClass} min-h-28 resize-y`}
                                value={form.offer}
                                onChange={(e) => setForm({ ...form, offer: e.target.value })}
                                placeholder="e.g. 2 Reels + 15 photos — €350"
                            />
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <label className={labelClass}>
                                Media in this preview ({form.assetIds.length} selected)
                            </label>
                            <input
                                className="w-full rounded border border-neutral-300 px-2 py-1.5 text-xs sm:w-48"
                                value={assetFilter}
                                onChange={(e) => setAssetFilter(e.target.value)}
                                placeholder="Filter assets…"
                            />
                        </div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center rounded border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                                {uploading
                                    ? `Uploading${uploadProgress != null ? ` ${uploadProgress}%` : "…"}`
                                    : "+ Upload media to this preview"}
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    disabled={uploading}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        e.target.value = "";
                                        void handleUploadToPreview(file);
                                    }}
                                />
                            </label>
                            <span className="text-xs text-neutral-500">
                                Uploads are <strong>private</strong> (preview-only) until you release them to your profile.
                            </span>
                        </div>
                        <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto rounded border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-4 sm:gap-2 sm:p-2 lg:grid-cols-6">
                            {filteredAssets.map((asset) => {
                                const selected = form.assetIds.includes(asset.id);
                                return (
                                    <button
                                        type="button"
                                        key={asset.id}
                                        onClick={() => toggleAsset(asset.id)}
                                        className={`group flex flex-col overflow-hidden rounded border-2 bg-white text-left transition-colors ${
                                            selected ? "border-neutral-900" : "border-transparent hover:border-neutral-300"
                                        }`}
                                    >
                                        <span className="relative block aspect-square w-full overflow-hidden bg-neutral-200">
                                            {assetThumb(asset) ? (
                                                <img
                                                    src={assetThumb(asset)}
                                                    alt={asset.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="grid h-full w-full place-items-center text-[0.6rem] text-neutral-500">
                                                    {asset.kind}
                                                </span>
                                            )}
                                            {asset.kind === "video" && (
                                                <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[0.55rem] text-white">
                                                    ▶
                                                </span>
                                            )}
                                            {asset.visibility === "preview" && (
                                                <span className="absolute bottom-1 left-1 rounded bg-amber-500/90 px-1 text-[0.5rem] font-medium uppercase text-white">
                                                    preview
                                                </span>
                                            )}
                                            {selected && (
                                                <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-neutral-900 text-[0.65rem] text-white">
                                                    ✓
                                                </span>
                                            )}
                                        </span>
                                        <span className="truncate px-1.5 py-1 text-[0.65rem] leading-tight text-neutral-600">
                                            {asset.title || "Untitled"}
                                        </span>
                                    </button>
                                );
                            })}
                            {filteredAssets.length === 0 && (
                                <p className="col-span-full py-4 text-center text-xs text-neutral-400">No assets match.</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving}
                            className="rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                        >
                            {saving ? "Saving…" : editingId === "new" ? "Create preview" : "Save changes"}
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            className="rounded border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <p className="py-6 text-center text-sm text-neutral-400">Loading previews…</p>
            ) : previews.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">No previews yet. Create your first one.</p>
            ) : (
                <ul className="space-y-2">
                    {previews.map((preview) => {
                        const expired = preview.expiresAt ? new Date(preview.expiresAt).getTime() < Date.now() : false;
                        return (
                            <li
                                key={preview.id}
                                className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="truncate font-medium text-neutral-900">{preview.title}</span>
                                        {!preview.isActive && (
                                            <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[0.6rem] uppercase text-neutral-600">
                                                off
                                            </span>
                                        )}
                                        {expired && (
                                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[0.6rem] uppercase text-red-600">
                                                expired
                                            </span>
                                        )}
                                        {preview.accessCode && (
                                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[0.6rem] uppercase text-amber-700">
                                                pin
                                            </span>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-neutral-500">
                                        {preview.clientName ? `${preview.clientName} · ` : ""}
                                        {preview.assetIds.length} item{preview.assetIds.length === 1 ? "" : "s"}
                                        {preview.expiresAt ? ` · until ${new Date(preview.expiresAt).toLocaleDateString()}` : ""}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => copyLink(preview)}
                                        className="flex-1 rounded border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 sm:flex-none sm:py-1"
                                    >
                                        Copy link
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => startEdit(preview)}
                                        className="flex-1 rounded border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 sm:flex-none sm:py-1"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(preview)}
                                        disabled={busyId === preview.id}
                                        className="flex-1 rounded border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 sm:flex-none sm:py-1"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <CreateClientDialog
                token={token}
                open={clientDialogOpen}
                onOpenChange={setClientDialogOpen}
                onCreated={handleClientCreated}
                onError={fail}
            />

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this preview?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget
                                ? `"${deleteTarget.title}" will be removed and its link will stop working. This can't be undone.`
                                : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTarget && void performDelete(deleteTarget)}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
};

export default ClientPreviewsManager;
