import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { Context } from '@deepseek-ai/cordis';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const dir = await mkdtemp(join(tmpdir(), 'dmu-package-'));
const require = createRequire(import.meta.url);
const oldHome = process.env.DSH_HOME;
try {
    execFileSync('tar', ['-xzf', resolve(`releases/dsh-mini-usage-${version}.tgz`), '-C', dir]);
    const base = join(dir, 'package'), pkg = JSON.parse(await readFile(join(base, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'dsh-mini-usage');
    assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0);
    assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml');
    assert.equal(pkg.dsh.client.platform, 'web');
    const plugin = await import(pathToFileURL(join(base, pkg.exports['.'])).href);
    process.env.DSH_HOME = join(dir, 'home');
    const ctx = new Context();
    let route;
    ctx.provide('sessionPersistence', { list: async () => [], open: async () => { throw Error('unused'); } });
    ctx.provide('webServer', { register: r => { route = r; return () => { route = undefined; }; } });
    try {
        const fiber = ctx.plugin(plugin, {});
        await fiber;
        assert.equal(route.path, '/api/dsh-mini-usage');
        await fiber.dispose();
        assert.equal(route, undefined);
    }
    finally {
        await ctx.fiber.dispose();
    }
    let client;
    runInNewContext(await readFile(join(base, pkg.exports['./client']), 'utf8'), { window: { __ModuleLoader__: { load: spec => { assert.equal(spec.id, pkg.name); client = spec.factory(require); } } } });
    assert.equal(typeof client.apply, 'function');
    assert.deepEqual(Array.from(client.inject), ['slots']);
    console.log('PASS: packed manifest, dependency-free payload, extracted Host enable/dispose, client module-loader envelope.');
}
finally {
    if (oldHome === undefined)
        delete process.env.DSH_HOME;
    else
        process.env.DSH_HOME = oldHome;
    await rm(dir, { recursive: true, force: true });
}
