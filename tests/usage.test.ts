import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foldEvents, newFold, summarize, dayKey } from '../src/usage.js';
import type { Event, Usage } from '../src/contracts.js';
export const event = (seq: number, time: string, usage?: Usage, extra: Partial<Event> = {}): Event => ({ seq, time: new Date(time).getTime(), type: 'assistant/message', data: { turn: 0, step: 0, usage, stream: [] }, ...extra });
const u = { inputTokens: 100, outputTokens: 20, cacheReadTokens: 30, cacheWriteTokens: 10 };
test('input includes both cache buckets; total excludes duplicated reasoning/total fields', () => { const s = newFold(); foldEvents(s, [event(0, '2026-10-16T09:00:00', u)]); assert.equal(s.days['2026-10-16'].input, 140); assert.equal(summarize({ s }, new Date('2026-10-16').getTime()).today.total, 160); });
test('duplicate seq and replacement settlements are not additive', () => { const s = newFold(); const a = event(0, '2026-10-16T09:00:00', u); foldEvents(s, [a, a, event(1, '2026-10-16T09:01:00', u), event(2, '2026-10-16T09:02:00', { ...u, outputTokens: 25 })]); assert.equal(s.days['2026-10-16'].output, 25); assert.equal(s.days['2026-10-16'].samples, 1); });
test('only last embedded usage is counted; old streamed chunks ignored', () => { const s = newFold(); foldEvents(s, [event(0, '2026-10-16T09:00:00', undefined, { type: 'assistant/chunk' }), event(1, '2026-10-16T09:00:00', undefined, { type: 'assistant/attempt', data: { turn: 0, step: 0, stream: [{ type: 'chunk', chunk: { type: 'usage', usage: u } }, { type: 'chunk', chunk: { type: 'usage', usage: { ...u, outputTokens: 40 } } }] } })]); assert.equal(s.days['2026-10-16'].output, 40); });
test('retry attempts are separately counted', () => { const s = newFold(); foldEvents(s, [event(0, '2026-10-16T09:00:00', u), event(1, '2026-10-16T09:01:00', undefined, { type: 'llm/retry-started' }), event(2, '2026-10-16T09:02:00', u)]); assert.equal(s.days['2026-10-16'].output, 40); });
test('cross-session and year/month rollover; replacements reattribute changed samples', () => { const a = newFold(), b = newFold(); foldEvents(a, [event(0, '2025-12-31T23:59:00', u), event(1, '2026-01-01T00:01:00', { ...u, outputTokens: 40 })]); foldEvents(b, [event(0, '2026-01-01T11:00:00', u)]); const v = summarize({ a, b }, new Date('2026-01-01T12:00:00').getTime()); assert.equal(v.today.total, 340); assert.equal(v.month.total, 340); assert.equal(a.days['2025-12-31'].samples, 0); });
test('identical replacement across midnight retains original day as official fold', () => { const s = newFold(); foldEvents(s, [event(0, '2026-10-15T23:59:00', u), event(1, '2026-10-16T00:01:00', u)]); assert.equal(s.days['2026-10-15'].samples, 1); assert.equal(s.days['2026-10-16'], undefined); });
test('missing and invalid usage stay unknown; explicit zero is known', () => {
    for (const usage of [undefined, { inputTokens: -1, outputTokens: 20 }, { inputTokens: 100, outputTokens: 20, totalTokens: 500 }]) {
        const s = newFold();
        foldEvents(s, [event(0, '2026-10-16T12:00:00', usage)]);
        assert.equal(summarize({ s }, new Date('2026-10-16T13:00:00').getTime()).today.total, null);
    }
    const s = newFold();
    foldEvents(s, [event(0, '2026-10-16T12:00:00', { inputTokens: 0, outputTokens: 0 })]);
    assert.equal(summarize({ s }, new Date('2026-10-16T13:00:00').getTime()).today.total, 0);
});
test('fork inherited prefix excluded', () => { const s = newFold(2); foldEvents(s, [event(0, '2026-10-16T09:00:00', u), event(1, '2026-10-16T09:00:00', u), event(2, '2026-10-16T10:00:00', u)]); assert.equal(s.days['2026-10-16'].samples, 1); });
test('84 calendar cells, Monday start, Sunday end, no future values', () => { const now = new Date('2026-10-16T12:00:00').getTime(), s = newFold(); foldEvents(s, [event(0, '2026-10-17T09:00:00', u)]); const v = summarize({ s }, now); assert.equal(v.days.length, 84); assert.equal(new Date(v.days[0].date + 'T12:00:00').getDay(), 1); assert.equal(new Date(v.days[83].date + 'T12:00:00').getDay(), 0); assert.equal(v.days.find(d => d.date === '2026-10-17')?.total, null); assert.equal(v.month.total, null); });
test('local timezone and DST use calendar arithmetic', () => {
    const old = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
        assert.equal(dayKey(Date.parse('2026-01-01T02:00:00Z')), '2025-12-31');
        const days = summarize({}, new Date('2026-03-10T12:00:00').getTime()).days;
        assert.equal(new Set(days.map(d => d.date)).size, 84);
    }
    finally {
        process.env.TZ = old;
    }
});
test('gaps refused instead of silently dropping data', () => { assert.throws(() => foldEvents(newFold(), [event(2, '2026-10-16', u)])); });
test('LLM compaction without reported usage makes the day unavailable', () => { const s = newFold(); foldEvents(s, [event(0, '2026-10-16T10:00:00', u), event(1, '2026-10-16T11:00:00', undefined, { type: 'compaction/summary', data: { llmStreamCall: true } })]); assert.equal(summarize({ s }, new Date('2026-10-16T12:00:00').getTime()).today.total, null); });
test('cache bucket correction across days follows official replacement even if aggregate input is identical', () => { const s = newFold(); foldEvents(s, [event(0, '2026-10-15T23:59:00', { inputTokens: 100, outputTokens: 20, cacheReadTokens: 30 }), event(1, '2026-10-16T00:01:00', { inputTokens: 110, outputTokens: 20, cacheReadTokens: 20 })]); assert.equal(s.days['2026-10-15'].samples, 0); assert.equal(s.days['2026-10-16'].input, 130); });
