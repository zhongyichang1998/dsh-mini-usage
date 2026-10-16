import type { Bucket, Day, Event, ModelIdentity, ModelUsage, Snapshot, Usage } from './contracts.js';
export const zero = (): Bucket => ({ input: 0, output: 0, samples: 0, missing: 0 });
export const unknownModel = (): ModelIdentity => ({ provider: null, model: null });
export const modelKey = (identity: ModelIdentity): string => JSON.stringify([identity.provider, identity.model]);
export const dayKey = (time: number): string => {
    const d = new Date(time);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export interface ModelFold extends ModelIdentity {
    days: Record<string, Bucket>;
}
export interface Fold {
    next: number;
    inherited: number;
    days: Record<string, Bucket>;
    models: Record<string, ModelFold>;
    route: ModelIdentity;
    last: {
        key: string;
        day: string;
        bucket: Bucket;
        signature: string;
        modelKey: string;
    } | null;
    anchor: string;
}
export const newFold = (inherited = 0): Fold => ({ next: inherited, inherited, days: {}, models: Object.create(null), route: unknownModel(), last: null, anchor: '' });
export const fingerprint = (e: Event): string => JSON.stringify([e.seq, e.type, e.time, e.data.turn, e.data.step]);
const valid = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const identifier = (value: unknown): string | null => typeof value === 'string' && value.trim().length > 0 && value.length <= 256 ? value : null;
function sample(u?: Usage): Bucket {
    if (!u || !valid(u.inputTokens) || !valid(u.outputTokens) || (u.cacheReadTokens !== undefined && !valid(u.cacheReadTokens)) || (u.cacheWriteTokens !== undefined && !valid(u.cacheWriteTokens)))
        return { ...zero(), missing: 1 };
    const input = u.inputTokens + (u.cacheReadTokens ?? 0) + (u.cacheWriteTokens ?? 0);
    if (!valid(input + u.outputTokens) || (u.totalTokens !== undefined && (!valid(u.totalTokens) || u.totalTokens !== input + u.outputTokens)))
        return { ...zero(), missing: 1 };
    return { input, output: u.outputTokens, samples: 1, missing: 0 };
}
export function add(to: Bucket, from: Bucket, sign = 1): void {
    for (const k of ['input', 'output', 'samples', 'missing'] as const)
        to[k] += from[k] * sign;
}
function attributedModel(event: Event, route: ModelIdentity): ModelIdentity {
    const source = event.data.message?.source;
    const model = identifier(source?.model), provider = identifier(source?.provider);
    // A settled message is authoritative; attempts fall back to the last logged request route.
    if (model !== null)
        return { model, provider };
    if (provider !== null && provider !== route.provider)
        return { provider, model: null };
    return { ...route };
}
function addModel(state: Fold, identity: ModelIdentity, day: string, bucket: Bucket): string {
    const id = modelKey(identity);
    const entry = state.models[id] ??= { ...identity, days: {} };
    add(entry.days[day] ??= zero(), bucket);
    return id;
}
function removeModel(state: Fold, previous: NonNullable<Fold['last']>): void {
    add(state.models[previous.modelKey].days[previous.day], previous.bucket, -1);
}
/** Durable settlement samples replace, never sum streamed cumulative usage. */
export function foldEvents(state: Fold, events: readonly Event[]): void {
    for (const event of events) {
        if (event.seq < state.next)
            continue;
        if (event.seq !== state.next || !Number.isFinite(event.time) || Number.isNaN(new Date(event.time).getTime()))
            throw new Error('Invalid event sequence');
        const { turn, step } = event.data;
        const key = `${turn}:${step}`;
        if (event.type === 'request/header') {
            const config = event.data.header?.config;
            state.route = { provider: identifier(config?.provider), model: identifier(config?.model) };
        }
        if (event.type === 'compaction/summary' && event.data.llmStreamCall === true) {
            const day = dayKey(event.time), bucket = { ...zero(), missing: 1 };
            add(state.days[day] ??= zero(), bucket);
            // Compaction can use a different route and reports no reliable model usage.
            addModel(state, unknownModel(), day, bucket);
        }
        if (event.type === 'llm/retry-started' && state.last?.key === key)
            state.last = null;
        if (event.type === 'assistant/message' || event.type === 'assistant/attempt') {
            if (!valid(turn) || !valid(step))
                throw new Error('Invalid settlement');
            let usage = event.type === 'assistant/message' ? event.data.usage : undefined;
            if (!usage) {
                const stream = event.data.stream ?? [];
                for (let i = stream.length - 1; i >= 0; i--) {
                    if (stream[i].type === 'chunk' && stream[i].chunk?.type === 'usage') {
                        usage = stream[i].chunk?.usage;
                        break;
                    }
                }
            }
            const bucket = sample(usage);
            const signature = bucket.samples ? JSON.stringify([usage!.inputTokens, usage!.outputTokens, usage!.cacheReadTokens ?? 0, usage!.cacheWriteTokens ?? 0]) : 'missing';
            const identity = attributedModel(event, state.route);
            const previous = state.last?.key === key ? state.last : null;
            if (!previous || previous.signature !== signature) {
                if (previous) {
                    add(state.days[previous.day], previous.bucket, -1);
                    removeModel(state, previous);
                }
                const day = dayKey(event.time);
                add(state.days[day] ??= zero(), bucket);
                state.last = { key, day, bucket, signature, modelKey: addModel(state, identity, day, bucket) };
            }
            else if (previous.modelKey !== modelKey(identity)) {
                // A final source may correct request-header attribution without changing usage.
                // Preserve the official fold's original accounting day for equal token samples.
                removeModel(state, previous);
                state.last = { ...previous, modelKey: addModel(state, identity, previous.day, previous.bucket) };
            }
        }
        state.next = event.seq + 1;
        state.anchor = fingerprint(event);
    }
}
export function toDay(date: string, bucket = zero()): Day {
    const known = bucket.samples > 0 && bucket.missing === 0;
    return { date, input: known ? bucket.input : null, output: known ? bucket.output : null, total: known ? bucket.input + bucket.output : null, samples: bucket.samples, missing: bucket.missing };
}
export function summarize(states: Record<string, Fold>, now = Date.now(), syncedAt = now): Snapshot {
    const buckets: Record<string, Bucket> = {};
    const today = dayKey(now), monthKey = today.slice(0, 7), month = zero();
    const todayModels = new Map<string, ModelFold>(), monthModels = new Map<string, ModelFold>();
    const collectModel = (map: Map<string, ModelFold>, id: string, entry: ModelFold, bucket: Bucket) => {
        const target = map.get(id) ?? { provider: entry.provider, model: entry.model, days: { total: zero() } };
        add(target.days.total, bucket);
        map.set(id, target);
    };
    for (const state of Object.values(states)) {
        for (const [date, b] of Object.entries(state.days))
            add(buckets[date] ??= zero(), b);
        for (const [id, entry] of Object.entries(state.models))
            for (const [date, b] of Object.entries(entry.days)) {
                if (date === today)
                    collectModel(todayModels, id, entry, b);
                if (date.slice(0, 7) === monthKey && date <= today)
                    collectModel(monthModels, id, entry, b);
            }
    }
    for (const [date, b] of Object.entries(buckets))
        if (date.slice(0, 7) === monthKey && date <= today)
            add(month, b);
    const renderModels = (map: Map<string, ModelFold>, period: string): ModelUsage[] => [...map.entries()]
        .filter(([, entry]) => entry.days.total.samples + entry.days.total.missing > 0)
        .map(([id, entry]) => ({ id, model: entry.model, provider: entry.provider, ...toDay(period, entry.days.total) }))
        .sort((a, b) => a.model === null && b.model !== null ? 1 : a.model !== null && b.model === null ? -1 : `${a.model ?? ''}/${a.provider ?? ''}`.localeCompare(`${b.model ?? ''}/${b.provider ?? ''}`, 'en'));
    const start = new Date(now);
    start.setHours(12, 0, 0, 0);
    start.setDate(start.getDate() - (start.getDay() + 6) % 7 - 77);
    const days: Day[] = [];
    for (let i = 0; i < 84; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const date = dayKey(d.getTime());
        days.push(date > today ? { ...toDay(date), future: true } : toDay(date, buckets[date]));
    }
    return { today: toDay(today, buckets[today]), month: toDay(monthKey, month), days, models: { today: renderModels(todayModels, today), month: renderModels(monthModels, monthKey) }, syncedAt, stale: false, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, sessions: Object.keys(states).length };
}
