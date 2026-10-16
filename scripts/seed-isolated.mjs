// TEST ONLY: fixed synthetic records, never imported or shipped by production.
import { Context } from '@deepseek-ai/cordis';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
const home = resolve(process.argv[2] ?? '');
if (!home.startsWith('/private/tmp/dsh-mini-'))
    throw Error('Only /private/tmp/dsh-mini-* fixture homes allowed');
const require = createRequire(import.meta.url), host = createRequire(require.resolve('@deepseek-ai/dsh/package.json'));
const { default: Jsonl } = await import(pathToFileURL(host.resolve('@deepseek-ai/dsh-session-persistence-jsonl')).href);
const { SESSION_FORMAT_VERSION } = await import(pathToFileURL(host.resolve('@deepseek-ai/dsh-session')).href);
const ctx = new Context();
try {
    await ctx.plugin(Jsonl, { root: join(home, 'sessions'), compression: 'zstd' });
    const persistence = ctx.get('sessionPersistence');
    const fixtures = [
        { id: 'mini-v110-fixture-a', model: 'glm-5.3-flash-free', provider: '测试来源 A', calls: [[-28, 18000, 6000], [-3, 54000, 9000], [-1, 26000, 8000], [0, 60000, 21000]] },
        { id: 'mini-v110-fixture-b', model: 'deepseek-v4.1-flash', provider: '测试来源 B', calls: [[-14, 40000, 13000], [-7, 70000, 18000], [0, 31200, 16250]] }
    ];
    for (const fixture of fixtures) {
        if (await persistence.stat(fixture.id))
            continue;
        const handle = await persistence.create({ id: fixture.id, version: SESSION_FORMAT_VERSION, createdAt: Date.now(), isSeeded: false, delegationDepth: 0 });
        let seq = 0, turn = 0;
        const events = [];
        for (const [offset, inputTokens, outputTokens] of fixture.calls) {
            turn++;
            const date = new Date();
            date.setDate(date.getDate() + offset);
            date.setHours(8, 0, 0, 0);
            const time = date.getTime(), data = { turn, step: 1 };
            events.push({ seq: seq++, time, type: 'turn/start', data: { turn } }, { seq: seq++, time, type: 'step/start', data }, { seq: seq++, time, type: 'assistant/message', surfaceOp: 'append', data: { ...data, message: { id: `fixture-${turn}`, role: 'assistant', source: { kind: 'model', provider: fixture.provider, model: fixture.model }, content: [{ type: 'text', text: '隔离界面测试' }] }, usage: { inputTokens, outputTokens }, stream: [{ type: 'text-chunks', time0: time, index: 0, dt: [], texts: ['隔离界面测试'] }, { type: 'chunk', time, chunk: { type: 'usage', usage: { inputTokens, outputTokens } } }] } }, { seq: seq++, time, type: 'step/end', data }, { seq: seq++, time, type: 'turn/end', data: { turn, reason: { kind: 'completed' } } });
        }
        await handle.append(events);
        await handle.close();
        // Reopen through official validation, not just append-time shape checks.
        const reader = await persistence.open(fixture.id, 'read');
        try {
            await reader.read();
        }
        finally {
            await reader.close();
        }
    }
    console.log('Created two isolated model fixtures; expected today total 128450.');
}
finally {
    await ctx.fiber.dispose();
}
