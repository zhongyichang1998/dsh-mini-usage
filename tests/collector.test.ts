import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Collector } from '../src/collector.js';
import type { Event, Persistence } from '../src/contracts.js';
const time = new Date('2026-10-16T12:00:00').getTime();
const ev = (seq: number): Event => ({ seq, time, type: 'assistant/message', data: { turn: seq, step: 0, usage: { inputTokens: 100, outputTokens: 20 } } });
async function fixture() {
    const dir = await mkdtemp(join(tmpdir(), 'dmu-test-'));
    let events = [ev(0)], revision = 'r1', fail = false, opens = 0, closed = 0;
    const p: Persistence = { list: async () => {
            if (fail)
                throw Error('IO');
            return [{ header: { id: 's' }, revision }];
        }, open: async () => { opens++; return { inheritedEventCount: 0, read: async (o = 0, n = 1000) => ({ events: events.slice(o, o + n) }), close: async () => { closed++; } }; } };
    return { dir, p, file: join(dir, 'index.json'), add: () => { events.push(ev(events.length)); revision += 'x'; }, fail: () => { fail = true; }, counts: () => ({ opens, closed }), rewrite: () => { events = [{ ...ev(0), time: time - 86400000 }]; revision += 'x'; } };
}
test('incremental reads skip unchanged logs, coalesce requests, restart resumes, deleted logs removed', async () => {
    const f = await fixture();
    try {
        const c = new Collector(f.p, f.file, () => time);
        const a = c.refresh(), b = c.refresh();
        assert.equal(a, b);
        assert.equal((await a).today.total, 120);
        await c.refresh();
        assert.equal(f.counts().opens, 1);
        f.add();
        assert.equal((await c.refresh()).today.total, 240);
        const restarted = new Collector(f.p, f.file, () => time);
        assert.equal((await restarted.refresh()).today.total, 240);
        assert.equal(f.counts().opens, f.counts().closed);
        const p = { ...f.p, list: async () => [] };
        assert.equal((await new Collector(p, f.file, () => time).refresh()).today.total, null);
        assert.equal(JSON.parse(await readFile(f.file, 'utf8')).states.s, undefined);
    }
    finally {
        await rm(f.dir, { recursive: true, force: true });
    }
});
test('failure retains snapshot and sync timestamp; cache stores no message content', async () => {
    const f = await fixture();
    try {
        const c = new Collector(f.p, f.file, () => time);
        const a = await c.refresh();
        f.fail();
        const b = await c.refresh();
        assert.equal(b.stale, true);
        assert.equal(b.today.total, a.today.total);
        assert.equal(b.syncedAt, a.syncedAt);
        assert.ok(!(await readFile(f.file, 'utf8')).includes('stream'));
    }
    finally {
        await rm(f.dir, { recursive: true, force: true });
    }
});
test('corrupt cache safely rebuilt; log truncation/changed anchor triggers rebuild', async () => {
    const f = await fixture();
    try {
        await writeFile(f.file, '{broken');
        const c = new Collector(f.p, f.file, () => time);
        assert.equal((await c.refresh()).today.total, 120);
        f.rewrite();
        assert.equal((await c.refresh()).today.total, null);
    }
    finally {
        await rm(f.dir, { recursive: true, force: true });
    }
});
test('unavailable first scan is unknown, never fabricated zero', async () => {
    const f = await fixture();
    try {
        f.fail();
        const v = await new Collector(f.p, f.file, () => time).refresh();
        assert.equal(v.today.total, null);
        assert.equal(v.syncedAt, 0);
        assert.equal(v.stale, true);
    }
    finally {
        await rm(f.dir, { recursive: true, force: true });
    }
});
