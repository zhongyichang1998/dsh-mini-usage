import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Event, Usage } from '../src/contracts.js';
import { foldEvents, newFold, summarize } from '../src/usage.js';
const now = new Date('2026-10-16T12:00:00').getTime();
const usage: Usage = { inputTokens: 100, outputTokens: 20, cacheReadTokens: 30 };
const header = (seq: number, provider = 'route-a', model = 'model-a'): Event => ({ seq, time: now, type: 'request/header', data: { header: { config: { provider, model } } } });
const message = (seq: number, model?: string, provider = 'route-a', time = now, turn = 1): Event => ({ seq, time, type: 'assistant/message', data: { turn, step: 1, usage, stream: [], ...(model ? { message: { source: { model, provider } } } : {}) } });
test('settled model source takes precedence over request route; no amount is lost', () => {
    const state = newFold();
    foldEvents(state, [header(0), message(1, 'actual-model', 'actual-route')]);
    const value = summarize({ state }, now);
    assert.equal(value.models.today.length, 1);
    assert.equal(value.models.today[0].model, 'actual-model');
    assert.equal(value.models.today[0].provider, 'actual-route');
    assert.equal(value.models.today[0].total, value.today.total);
});
test('same model from different providers remains separate; cross-session instances combine', () => {
    const a = newFold(), b = newFold();
    foldEvents(a, [message(0, 'shared', 'provider-a'), message(1, 'shared', 'provider-b', now, 2)]);
    foldEvents(b, [message(0, 'shared', 'provider-a')]);
    const v = summarize({ a, b }, now);
    assert.equal(v.models.today.length, 2);
    assert.equal(v.models.today.find(m => m.provider === 'provider-a')?.total, 300);
    assert.equal(v.models.today.reduce((sum, m) => sum + m.total!, 0), v.today.total);
});
test('stream-only attempt uses persisted request header, including after JSON restart', () => {
    let state = newFold();
    foldEvents(state, [header(0, 'route-a', 'stream-model')]);
    state = JSON.parse(JSON.stringify(state));
    foldEvents(state, [{ seq: 1, time: now, type: 'assistant/attempt', data: { turn: 1, step: 1, stream: [{ type: 'chunk', chunk: { type: 'usage', usage: { ...usage, outputTokens: 10 } } }, { type: 'chunk', chunk: { type: 'usage', usage } }] } }]);
    const v = summarize({ state }, now);
    assert.equal(v.models.today[0].model, 'stream-model');
    assert.equal(v.models.today[0].total, 150);
});
test('model source correction with identical usage preserves original accounting day', () => {
    const state = newFold();
    const yesterday = now - 86400000;
    foldEvents(state, [{ ...header(0, 'route-a', 'provisional'), time: yesterday }, message(1, undefined, 'route-a', yesterday), message(2, 'settled', 'route-b')]);
    const v = summarize({ state }, now);
    assert.equal(v.today.total, null);
    assert.equal(v.models.today.length, 0);
    assert.equal(v.models.month.length, 1);
    assert.equal(v.models.month[0].model, 'settled');
    assert.equal(v.models.month[0].total, 150);
    assert.equal(v.month.total, 150);
});
test('changed usage replaces old model and day, retry creates separately charged attempt', () => {
    const state = newFold();
    const first = message(0, 'old', 'route-a', now - 86400000), second = { ...message(1, 'new'), data: { ...message(1, 'new').data, usage: { ...usage, outputTokens: 30 } } };
    foldEvents(state, [first, second, { seq: 2, time: now, type: 'llm/retry-started', data: { turn: 1, step: 1 } }, message(3, 'retry-model')]);
    const v = summarize({ state }, now);
    assert.equal(v.models.today.length, 2);
    assert.equal(v.models.month.some(m => m.model === 'old'), false);
    assert.equal(v.today.total, 310);
    assert.equal(v.models.today.reduce((sum, m) => sum + m.total!, 0), 310);
});
test('unknown model is labelled, never inferred; absent usage remains unavailable per model', () => {
    const state = newFold();
    foldEvents(state, [message(0), { ...message(1, 'missing'), data: { turn: 2, step: 1, message: { source: { model: 'missing', provider: 'route-a' } }, stream: [] } }]);
    const v = summarize({ state }, now);
    assert.equal(v.today.total, null);
    assert.equal(v.models.today.find(m => m.model === null)?.total, 150);
    assert.equal(v.models.today.find(m => m.model === 'missing')?.total, null);
});
test('today and month scopes exclude prior month and future calls; model list uses stable name order', () => {
    const state = newFold();
    foldEvents(state, [message(0, 'yesterday', 'route-a', now - 86400000, 1), message(1, 'a-today', 'route-a', now, 2), message(2, 'old-month', 'route-a', new Date('2026-09-30T12:00:00').getTime(), 3), message(3, 'future', 'route-a', now + 86400000, 4)]);
    const v = summarize({ state }, now);
    assert.deepEqual(v.models.today.map(m => m.model), ['a-today']);
    assert.deepEqual(v.models.month.map(m => m.model), ['a-today', 'yesterday']);
    assert.equal(v.month.total, 300);
});
test('model metadata is safe text: prototype-like identifiers aggregate without pollution', () => {
    const state = newFold();
    foldEvents(state, [message(0, '__proto__', 'constructor')]);
    const v = summarize({ state }, now);
    assert.equal(v.models.today[0].model, '__proto__');
    assert.equal(v.today.total, 150);
});
