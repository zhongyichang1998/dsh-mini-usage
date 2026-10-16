import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import * as plugin from '../src/index.js';
import { Collector } from '../src/collector.js';
import type { HostContext } from '../src/contracts.js';
const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve('@deepseek-ai/dsh/package.json'));
test('real Cordis 4.0.4 enable / disable / re-enable releases routes and timers', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dmu-lifecycle-'));
    const old = process.env.DSH_HOME;
    process.env.DSH_HOME = root;
    const ctx = new Context();
    let route: Parameters<HostContext['webServer']['register']>[0] | undefined;
    ctx.provide('sessionPersistence', { list: async () => [], open: async () => { throw Error('not used'); } });
    ctx.provide('webServer', { register: (r: typeof route) => { assert.equal(route, undefined); route = r; return () => { route = undefined; }; } });
    try {
        let fiber = ctx.plugin(plugin as never, {} as never);
        await fiber;
        assert.ok(route);
        await fiber.dispose();
        assert.equal(route, undefined);
        fiber = ctx.plugin(plugin as never, {} as never);
        await fiber;
        assert.ok(route);
        await fiber.dispose();
        assert.equal(route, undefined);
    }
    finally {
        await ctx.fiber.dispose();
        if (old === undefined)
            delete process.env.DSH_HOME;
        else
            process.env.DSH_HOME = old;
        await rm(root, { recursive: true, force: true });
    }
});
test('official rc.2 JSONL backend, durable history and restart', async () => {
    const { default: Jsonl } = await import(pathToFileURL(dshRequire.resolve('@deepseek-ai/dsh-session-persistence-jsonl')).href);
    const { SESSION_FORMAT_VERSION } = await import(pathToFileURL(dshRequire.resolve('@deepseek-ai/dsh-session')).href);
    const root = await mkdtemp(join(tmpdir(), 'dmu-jsonl-'));
    const ctx = new Context();
    try {
        await ctx.plugin(Jsonl, { root: join(root, 'sessions'), compression: 'none' });
        const persistence = ctx.get('sessionPersistence');
        const now = Date.now();
        const handle = await persistence.create({ id: 'mini-usage-test', version: SESSION_FORMAT_VERSION, createdAt: now, isSeeded: false, delegationDepth: 0 });
        await handle.append([{ type: 'turn/start', seq: 0, time: now, data: { turn: 1 } }, { type: 'step/start', seq: 1, time: now, data: { turn: 1, step: 1 } }, { type: 'assistant/attempt', seq: 2, time: now, data: { turn: 1, step: 1, stream: [{ type: 'chunk', time: now, chunk: { type: 'usage', usage: { inputTokens: 200, outputTokens: 50, cacheReadTokens: 100 } } }] } }]);
        await handle.close();
        const c = new Collector(persistence, join(root, 'cache.json'));
        const v = await c.refresh();
        assert.equal(v.stale, false);
        assert.equal(v.today.total, 350);
        assert.equal((await new Collector(persistence, join(root, 'cache.json')).refresh()).today.total, 350);
    }
    finally {
        await ctx.fiber.dispose();
        await rm(root, { recursive: true, force: true });
    }
});
test('route rejects non-loopback, missing custom header and cross-origin requests', () => {
    const req = (peer: string, headers: Record<string, string>) => ({ socket: { remoteAddress: peer }, headers }) as never;
    assert.equal(plugin.allowed(req('127.0.0.1', { host: '127.0.0.1:9000', 'x-dsh-mini-usage': '1' })), true);
    assert.equal(plugin.allowed(req('8.8.8.8', { host: '127.0.0.1:9000', 'x-dsh-mini-usage': '1' })), false);
    assert.equal(plugin.allowed(req('127.0.0.1', { host: '127.0.0.1:9000' })), false);
    assert.equal(plugin.allowed(req('127.0.0.1', { host: 'attacker.test', 'x-dsh-mini-usage': '1' })), false);
    assert.equal(plugin.allowed(req('127.0.0.1', { host: '127.0.0.1:9000', 'x-dsh-mini-usage': '1', origin: 'https://attacker.test' })), false);
});
