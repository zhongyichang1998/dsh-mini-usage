import { homedir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage } from 'node:http';
import type { HostContext } from './contracts.js';
import { Collector } from './collector.js';
export const name = 'dsh-mini-usage';
export const inject = ['webServer', 'sessionPersistence'];
export const endpoint = '/api/dsh-mini-usage';
export function allowed(req: IncomingMessage): boolean {
    const peer = req.socket.remoteAddress?.replace(/^::ffff:/, '');
    const loopback = peer === '::1' || /^127(?:\.\d{1,3}){3}$/.test(peer ?? '');
    try {
        const host = new URL(`http://${req.headers.host}`);
        if (!loopback || !['localhost', '127.0.0.1', '[::1]'].includes(host.hostname))
            return false;
        // A custom header forces cross-origin browsers through a denied preflight.
        if (req.headers['x-dsh-mini-usage'] !== '1')
            return false;
        if (req.headers.origin && req.headers.origin !== host.origin)
            return false;
        return true;
    }
    catch {
        return false;
    }
}
export function apply(ctx: HostContext): void {
    const collector = new Collector(ctx.sessionPersistence, join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'storages', 'dsh-mini-usage', 'index-v3.json'));
    ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: endpoint, handler: async (req, res) => {
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.setHeader('cache-control', 'no-store');
            res.setHeader('x-content-type-options', 'nosniff');
            if (req.method !== 'GET') {
                res.statusCode = 405;
                res.end('{}');
                return;
            }
            if (!allowed(req)) {
                res.statusCode = 403;
                res.end('{}');
                return;
            }
            res.end(JSON.stringify(await collector.refresh()));
        } }), 'dsh-mini-usage: read-only route');
    ctx.effect(() => {
        void collector.refresh();
        const timer = setInterval(() => { void collector.refresh(); }, 300000);
        timer.unref?.();
        return () => { clearInterval(timer); collector.stop(); };
    }, 'dsh-mini-usage: refresh lifecycle');
}
