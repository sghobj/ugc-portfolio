import { useState } from "react";
import {
    releaseUgcAdminAsset,
    type AssetPlacement,
    type UgcAdminAsset,
    type UgcAdminCollection,
} from "@/lib/ugcAdminApi";

type PreviewAssetsTabProps = {
    token: string;
    assets: UgcAdminAsset[];
    collections: UgcAdminCollection[];
    onMessage?: (message: string) => void;
    onError?: (message: string) => void;
    onChanged?: () => void | Promise<void>;
};

const assetThumb = (asset: UgcAdminAsset): string =>
    asset.thumbnailUrl ||
    asset.cloudinary?.thumbnailUrl ||
    asset.bunny?.thumbnailUrl ||
    asset.cloudinary?.secureUrl ||
    asset.secureUrl ||
    "";

const PreviewAssetsTab = ({
    token,
    assets,
    collections,
    onMessage,
    onError,
    onChanged,
}: PreviewAssetsTabProps) => {
    const [busyId, setBusyId] = useState<number | null>(null);
    const [collectionByAsset, setCollectionByAsset] = useState<Record<number, string>>({});

    const release = async (
        asset: UgcAdminAsset,
        target: { placement?: AssetPlacement; collectionId?: number | null },
    ) => {
        setBusyId(asset.id);
        try {
            await releaseUgcAdminAsset(token, asset.id, target);
            onMessage?.(`Released "${asset.title}" to your public profile.`);
            await onChanged?.();
        } catch (error) {
            onError?.(error instanceof Error ? error.message : "Failed to release asset.");
        } finally {
            setBusyId(null);
        }
    };

    if (assets.length === 0) {
        return (
            <p className="mt-4 text-sm text-muted-foreground">
                No preview-only media yet. Upload media inside a preview (in the Client Previews panel above) — it
                stays private here until you release it.
            </p>
        );
    }

    return (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
                const busy = busyId === asset.id;
                return (
                    <article key={asset.id} className="rounded-md border border-border bg-background p-3">
                        <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded bg-muted">
                            {assetThumb(asset) ? (
                                <img src={assetThumb(asset)} alt={asset.title} className="h-full w-full object-cover" />
                            ) : (
                                <span className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                                    {asset.kind}
                                </span>
                            )}
                            <span className="absolute left-1 top-1 rounded bg-amber-500/90 px-1 text-[0.55rem] font-medium uppercase text-white">
                                preview
                            </span>
                            {asset.kind === "video" && (
                                <span className="absolute right-1 top-1 rounded bg-black/70 px-1 text-[0.55rem] text-white">
                                    ▶
                                </span>
                            )}
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">{asset.title}</p>
                        <p className="mb-2 text-xs text-muted-foreground">{asset.kind}</p>

                        <p className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                            Release to profile
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {asset.kind === "video" ? (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => release(asset, { placement: "video" })}
                                    className="rounded bg-primary px-2.5 py-1 text-xs text-primary-foreground disabled:opacity-50"
                                >
                                    → Reels
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => release(asset, { placement: "highlight" })}
                                    className="rounded bg-primary px-2.5 py-1 text-xs text-primary-foreground disabled:opacity-50"
                                >
                                    → Highlights
                                </button>
                            )}
                        </div>

                        {asset.kind === "photo" && collections.length > 0 && (
                            <div className="mt-2 flex gap-2">
                                <select
                                    value={collectionByAsset[asset.id] ?? ""}
                                    onChange={(e) =>
                                        setCollectionByAsset((current) => ({ ...current, [asset.id]: e.target.value }))
                                    }
                                    className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                                >
                                    <option value="">Add to collection…</option>
                                    {collections.map((collection) => (
                                        <option key={collection.id} value={collection.id}>
                                            {collection.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    disabled={busy || !collectionByAsset[asset.id]}
                                    onClick={() =>
                                        release(asset, { collectionId: Number(collectionByAsset[asset.id]) })
                                    }
                                    className="rounded border border-border px-2.5 py-1 text-xs text-foreground disabled:opacity-40"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </article>
                );
            })}
        </div>
    );
};

export default PreviewAssetsTab;
