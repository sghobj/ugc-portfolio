import { useCallback, useEffect, useState } from "react";
import {
    getUgcAdminSettings,
    updateUgcAdminSettings,
    type UgcAdminSettings,
} from "@/lib/ugcAdminApi";

type MetricsSettingsProps = {
    token: string;
    onMessage?: (message: string) => void;
    onError?: (message: string) => void;
};

type FormState = {
    showMetrics: boolean;
    perfPeriodLabel: string;
    perfViews: string;
    perfReached: string;
    perfNonFollowerPct: string;
    perfInteractions: string;
    perfFollowers: string;
    perfNote: string;
};

// Suggested defaults from the latest Instagram professional dashboard (30 days).
const SUGGESTED: FormState = {
    showMetrics: false,
    perfPeriodLabel: "Last 30 days",
    perfViews: "234370",
    perfReached: "141127",
    perfNonFollowerPct: "86",
    perfInteractions: "18412",
    perfFollowers: "1203",
    perfNote: "141K accounts reached from ~1.2k followers — 86% of views came from non-followers.",
};

const num = (value: number | null): string => (value == null ? "" : String(value));
const toNum = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const inputClass =
    "w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-800";
const labelClass = "block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1";

const MetricsSettings = ({ token, onMessage, onError }: MetricsSettingsProps) => {
    const [form, setForm] = useState<FormState>(SUGGESTED);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const settings = await getUgcAdminSettings(token);
            const hasValues =
                settings.perfViews != null ||
                settings.perfReached != null ||
                settings.perfInteractions != null ||
                Boolean(settings.perfPeriodLabel);
            setForm({
                showMetrics: settings.showMetrics,
                // If nothing is saved yet, prefill the suggested Instagram numbers.
                perfPeriodLabel: hasValues ? settings.perfPeriodLabel ?? "" : SUGGESTED.perfPeriodLabel,
                perfViews: hasValues ? num(settings.perfViews) : SUGGESTED.perfViews,
                perfReached: hasValues ? num(settings.perfReached) : SUGGESTED.perfReached,
                perfNonFollowerPct: hasValues ? num(settings.perfNonFollowerPct) : SUGGESTED.perfNonFollowerPct,
                perfInteractions: hasValues ? num(settings.perfInteractions) : SUGGESTED.perfInteractions,
                perfFollowers: hasValues ? num(settings.perfFollowers) : SUGGESTED.perfFollowers,
                perfNote: hasValues ? settings.perfNote ?? "" : SUGGESTED.perfNote,
            });
        } catch (error) {
            onError?.(error instanceof Error ? error.message : "Failed to load metrics settings.");
        } finally {
            setLoading(false);
        }
    }, [token, onError]);

    useEffect(() => {
        void load();
    }, [load]);

    const persist = async (patch: Partial<UgcAdminSettings>) => {
        setSaving(true);
        try {
            await updateUgcAdminSettings(token, patch);
            onMessage?.("Metrics settings saved.");
        } catch (error) {
            onError?.(error instanceof Error ? error.message : "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (next: boolean) => {
        setForm((current) => ({ ...current, showMetrics: next }));
        await persist({ showMetrics: next });
    };

    const saveStats = async () => {
        await persist({
            perfPeriodLabel: form.perfPeriodLabel.trim(),
            perfViews: toNum(form.perfViews),
            perfReached: toNum(form.perfReached),
            perfNonFollowerPct: toNum(form.perfNonFollowerPct),
            perfInteractions: toNum(form.perfInteractions),
            perfFollowers: toNum(form.perfFollowers),
            perfNote: form.perfNote.trim(),
        });
    };

    return (
        <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Performance metrics</h2>
                    <p className="text-sm text-neutral-500">
                        Show Instagram content-performance stats on your site. One switch turns it all on or off.
                    </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-800">
                    <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={form.showMetrics}
                        disabled={loading || saving}
                        onChange={(e) => void toggle(e.target.checked)}
                    />
                    {form.showMetrics ? "Metrics are shown" : "Metrics are hidden"}
                </label>
            </div>

            <div className={form.showMetrics ? "" : "opacity-60"}>
                <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
                    Homepage performance band
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-3">
                        <label className={labelClass}>Period label</label>
                        <input
                            className={inputClass}
                            value={form.perfPeriodLabel}
                            onChange={(e) => setForm({ ...form, perfPeriodLabel: e.target.value })}
                            placeholder="Last 30 days"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Views</label>
                        <input className={inputClass} value={form.perfViews} onChange={(e) => setForm({ ...form, perfViews: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Accounts reached</label>
                        <input className={inputClass} value={form.perfReached} onChange={(e) => setForm({ ...form, perfReached: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Non-follower %</label>
                        <input className={inputClass} value={form.perfNonFollowerPct} onChange={(e) => setForm({ ...form, perfNonFollowerPct: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Interactions</label>
                        <input className={inputClass} value={form.perfInteractions} onChange={(e) => setForm({ ...form, perfInteractions: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Followers</label>
                        <input className={inputClass} value={form.perfFollowers} onChange={(e) => setForm({ ...form, perfFollowers: e.target.value })} />
                    </div>
                    <div className="sm:col-span-3">
                        <label className={labelClass}>Note (optional)</label>
                        <textarea
                            className={`${inputClass} min-h-16`}
                            value={form.perfNote}
                            onChange={(e) => setForm({ ...form, perfNote: e.target.value })}
                        />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => void saveStats()}
                    disabled={saving || loading}
                    className="mt-4 rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                    {saving ? "Saving…" : "Save stats"}
                </button>
                <p className="mt-2 text-xs text-neutral-500">
                    Leave a field blank to hide it. Per-reel numbers (views/saves/shares/likes) are set on each video asset.
                </p>
            </div>
        </section>
    );
};

export default MetricsSettings;
