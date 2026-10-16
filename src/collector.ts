import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Persistence, Snapshot } from './contracts.js';
import { fingerprint, foldEvents, newFold, summarize, modelKey, type Fold } from './usage.js';
const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
function validFold(x: Fold): boolean {
    const integer = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
    const identity = (v: Fold['route']) => !!v && [v.provider, v.model].every(s => s === null || (typeof s === 'string' && s.length > 0 && s.length <= 256));
    const bucket = (b: Fold['days'][string]) => !!b && ['input', 'output', 'samples', 'missing'].every(k => integer(b[k as keyof typeof b]));
    const days = (v: Fold['days']) => !!v && !Array.isArray(v) && Object.entries(v).every(([d, b]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && bucket(b));
    if (!x || !integer(x.next) || !integer(x.inherited) || x.next < x.inherited || typeof x.anchor !== 'string' || !days(x.days) || !identity(x.route) || !x.models)
        return false;
    if (!Object.entries(x.models).every(([key, entry]) => identity(entry) && key === modelKey(entry) && days(entry.days)))
        return false;
    return x.last === null || (!!x.last && typeof x.last.key === 'string' && typeof x.last.signature === 'string' && bucket(x.last.bucket) && !!x.days[x.last.day] && !!x.models[x.last.modelKey]?.days[x.last.day]);
}
export class Collector {
    private states: Record<string, Fold> = Object.create(null);
    private revisions = new Map<string, string>(); // Opaque tokens are valid ONLY within this service instance.
    private inflight?: Promise<Snapshot>;
    private loaded = false;
    private currentZone = zone();
    private stopped = false;
    private last?: Snapshot;
    constructor(private persistence: Persistence, private cacheFile: string, private now = Date.now) { }
    stop(): void { this.stopped = true; }
    refresh(): Promise<Snapshot> {
        if (this.inflight)
            return this.inflight;
        this.inflight = this.collect().finally(() => { this.inflight = undefined; });
        return this.inflight;
    }
    private async load(): Promise<void> {
        this.loaded = true;
        try {
            const raw = JSON.parse(await readFile(this.cacheFile, 'utf8'));
            if (raw.version === 3 && raw.zone === this.currentZone && raw.states && Object.values(raw.states).every(x => validFold(x as Fold)) && Number.isFinite(raw.syncedAt)) {
                this.states = Object.assign(Object.create(null), raw.states);
                this.last = summarize(this.states, this.now(), raw.syncedAt);
            }
        }
        catch { /* Missing or corrupt derived cache is rebuilt from authoritative records. */ }
    }
    private async collect(): Promise<Snapshot> {
        if (!this.loaded)
            await this.load();
        if (this.currentZone !== zone()) {
            this.currentZone = zone();
            this.states = Object.create(null);
            this.revisions.clear();
            this.last = undefined;
        }
        try {
            const listing = await this.persistence.list();
            const next: Record<string, Fold> = Object.create(null);
            const revisions = new Map<string, string>();
            // Serial bounded reads: never hold multiple full histories at once.
            for (const row of listing) {
                if (this.stopped)
                    throw new Error('Stopped');
                const id = row.header.id;
                if (this.revisions.get(id) === row.revision && this.states[id]) {
                    next[id] = this.states[id];
                    revisions.set(id, row.revision);
                    continue;
                }
                const handle = await this.persistence.open(id, 'read');
                try {
                    let state = this.states[id] ? structuredClone(this.states[id]) : newFold(handle.inheritedEventCount);
                    if (state.inherited !== handle.inheritedEventCount)
                        state = newFold(handle.inheritedEventCount);
                    if (state.next > state.inherited) {
                        const { events } = await handle.read(state.next - 1, 1);
                        if (!events[0] || fingerprint(events[0]) !== state.anchor)
                            state = newFold(handle.inheritedEventCount);
                    }
                    for (;;) {
                        if (this.stopped)
                            throw new Error('Stopped');
                        const { events } = await handle.read(state.next, 512);
                        foldEvents(state, events);
                        if (events.length < 512)
                            break;
                    }
                    next[id] = state;
                    revisions.set(id, row.revision);
                }
                finally {
                    await handle.close();
                }
            }
            if (this.stopped)
                throw new Error('Stopped');
            const result = summarize(next, this.now());
            // Commit only after every session read succeeds. Preserve a consistent previous snapshot on failure.
            this.states = next;
            this.revisions = revisions;
            this.last = result;
            const temp = `${this.cacheFile}.${process.pid}.tmp`;
            try {
                await mkdir(dirname(this.cacheFile), { recursive: true, mode: 0o700 });
                await writeFile(temp, JSON.stringify({ version: 3, zone: this.currentZone, states: next, syncedAt: result.syncedAt }), { mode: 0o600 });
                await rename(temp, this.cacheFile);
            }
            catch {
                await unlink(temp).catch(() => { });
                return { ...result, error: '用量已更新，缓存暂时无法保存。' };
            }
            return result;
        }
        catch {
            const result = this.last ? summarize(this.states, this.now(), this.last.syncedAt) : summarize({}, this.now(), 0);
            return { ...result, stale: true, error: '同步失败，已保留上次有效数据。' };
        }
    }
}
