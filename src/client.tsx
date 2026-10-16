import { MiniUsage } from './ui.js';
import type { ClientContext, Snapshot } from './contracts.js';
import css from './style.css';
export const inject = ['slots'];
export function apply(ctx: ClientContext): void {
    let inflight: Promise<Snapshot> | undefined;
    const abort = new AbortController();
    const load = () => inflight ?? (inflight = fetch('/api/dsh-mini-usage', { headers: { 'x-dsh-mini-usage': '1' }, signal: AbortSignal.any([abort.signal, AbortSignal.timeout(60000)]) }).then(async (r) => {
        if (!r.ok)
            throw new Error('Unavailable');
        const value = await r.json() as Snapshot;
        if (!value.today || !value.month || value.days?.length !== 84 || !Array.isArray(value.models?.today) || !Array.isArray(value.models?.month))
            throw new Error('Invalid response');
        return value;
    }).finally(() => { inflight = undefined; }));
    ctx.effect(() => { const style = document.createElement('style'); style.dataset.dshMiniUsage = ''; style.textContent = css; document.head.append(style); return () => { style.remove(); abort.abort(); }; }, 'dsh-mini-usage: scoped style and request cleanup');
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({ name: 'sidebar.footer.action', id: 'dsh-mini-usage', order: 30 }, ({ wide }) => <MiniUsage wide={wide} load={load}/>));
}
