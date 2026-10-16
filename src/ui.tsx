import { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import type { Day, ModelUsage, Snapshot } from './contracts.js';
export const compact = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const exact = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('zh-CN').format(n);
function Icon({ refresh = false }: {
    refresh?: boolean;
}) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{refresh ? <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 7a7 7 0 0 1 11.5-1L20 9M4 15l2.4 3A7 7 0 0 0 18 17"/></> : <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>}</svg>;
}
export function intensity(day: Day, max: number): number { return !day.total ? 0 : Math.min(4, Math.max(1, Math.ceil(4 * Math.sqrt(day.total / max)))); }
function Heatmap({ days, today }: {
    days: Day[];
    today: string;
}) {
    const max = Math.max(1, ...days.map(d => d.total ?? 0));
    return <><div className="dmu-section-heading"><span>用量分布</span><span className="dmu-subtle">近 12 周</span></div><div className="dmu-heatmap" role="group" aria-label="最近十二周每日用量，周一至周日">{days.map(d => {
            const date = new Date(`${d.date}T12:00:00`).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
            const label = `${date} · ${d.future ? '未来日期' : d.total === null ? (d.missing ? '用量暂不可用' : '暂无记录') : `${exact(d.total)} 个 Token`}`;
            return <span key={d.date} className={`dmu-cell dmu-level-${intensity(d, max)}`} data-unknown={!d.future && d.total === null || undefined} data-future={d.future || undefined} data-today={d.date === today || undefined} title={label} aria-label={label} tabIndex={d.future ? -1 : 0}><span className="dmu-tooltip" role="tooltip">{label}</span></span>;
        })}</div><div className="dmu-legend"><span>少</span>{[0, 1, 2, 3, 4].map(i => <i key={i} className={`dmu-level-${i}`}/>)}<span>多</span><span className="dmu-unknown-key">虚线 · 无记录</span></div></>;
}
function ModelList({ models, period, setPeriod }: {
    models: Snapshot['models'];
    period: 'today' | 'month';
    setPeriod: (p: 'today' | 'month') => void;
}) {
    const rows = models[period];
    return <section className="dmu-models" aria-label="模型用量"><div className="dmu-section-heading"><span>使用模型</span><div className="dmu-period" role="group" aria-label="模型统计范围">{(['today', 'month'] as const).map(p => <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>{p === 'today' ? '今天' : '本月'}</button>)}</div></div>{rows.length ? <div className="dmu-model-list" role="list" aria-label={`${period === 'today' ? '今天' : '本月'}使用的模型`}>{rows.map(row => <ModelRow key={row.id} row={row}/>)}</div> : <p className="dmu-empty dmu-model-empty">{period === 'today' ? '今天' : '本月'}暂无模型调用记录</p>}</section>;
}
function ModelRow({ row }: {
    row: ModelUsage;
}) {
    const name = row.model ?? '未标注模型';
    return <div className="dmu-model-row" role="listitem" aria-label={`${name}，${row.provider ?? '来源未标注'}，输入 ${exact(row.input)}，输出 ${exact(row.output)}，总量 ${exact(row.total)}`} title={row.missing ? '部分调用未返回可靠用量' : `${name} · ${row.provider ?? '来源未标注'} · ${exact(row.total)} 个 Token`}><div className="dmu-model-top"><span className="dmu-model-name" title={name}>{name}</span><strong>{compact(row.total)}</strong></div><div className="dmu-model-meta"><span className="dmu-model-provider" title={row.provider ?? '来源未标注'}>{row.provider ?? '来源未标注'}</span><span>输入 {compact(row.input)}<i />输出 {compact(row.output)}</span></div></div>;
}
export function MiniUsage({ wide, load }: {
    wide: boolean;
    load: () => Promise<Snapshot>;
}) {
    const [data, setData] = useState<Snapshot>();
    const [loading, setLoading] = useState(false), [failed, setFailed] = useState(false), [open, setOpen] = useState(false), [narrow, setNarrow] = useState(false);
    const [period, setPeriod] = useState<'today' | 'month'>('today');
    const [, tick] = useState(0);
    const button = useRef<HTMLButtonElement>(null), root = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null);
    const busy = useRef(false), alive = useRef(true), id = useId();
    const refresh = async () => {
        if (busy.current)
            return;
        busy.current = true;
        setLoading(true);
        try {
            const result = await load();
            if (alive.current) {
                setData(result);
                setFailed(false);
            }
        }
        catch {
            if (alive.current)
                setFailed(true);
        }
        finally {
            busy.current = false;
            if (alive.current)
                setLoading(false);
        }
    };
    useEffect(() => {
        alive.current = true;
        void refresh();
        const timer = setInterval(() => void refresh(), 300000), age = setInterval(() => tick(n => n + 1), 30000);
        return () => { alive.current = false; clearInterval(timer); clearInterval(age); };
    }, [load]);
    useEffect(() => {
        if (!root.current)
            return;
        const observer = new ResizeObserver(entries => setNarrow(entries[0].contentRect.width < 112));
        observer.observe(root.current);
        return () => observer.disconnect();
    }, []);
    function position() {
        if (!button.current || !panel.current)
            return;
        const rect = button.current.getBoundingClientRect(), p = panel.current, gap = 10;
        const width = Math.min(312, window.innerWidth - 2 * gap);
        p.style.width = `${width}px`;
        p.style.maxHeight = `${window.innerHeight - 2 * gap}px`;
        const height = p.getBoundingClientRect().height;
        let x = rect.left, y = rect.top - height - 8;
        if (y < gap) {
            x = rect.right + 8;
            y = rect.bottom - height;
        }
        p.style.left = `${Math.max(gap, Math.min(x, window.innerWidth - width - gap))}px`;
        p.style.top = `${Math.max(gap, Math.min(y, window.innerHeight - height - gap))}px`;
    }
    useEffect(() => {
        const p = panel.current;
        if (!p)
            return;
        const listener = () => { const shown = p.matches(':popover-open'); setOpen(shown); if (!shown && document.activeElement === document.body)
            button.current?.focus(); };
        const keydown = (e: KeyboardEvent) => { if (e.key === 'Escape' && p.matches(':popover-open')) {
            e.preventDefault();
            p.hidePopover();
            button.current?.focus();
        } };
        const outside = (e: MouseEvent) => { const target = e.target as Node; if (!p.contains(target) && !button.current?.contains(target) && p.matches(':popover-open'))
            p.hidePopover(); };
        p.addEventListener('toggle', listener);
        document.addEventListener('keydown', keydown, true);
        document.addEventListener('click', outside);
        return () => { p.removeEventListener('toggle', listener); document.removeEventListener('keydown', keydown, true); document.removeEventListener('click', outside); };
    }, []);
    useEffect(() => {
        if (!open)
            return;
        position();
        const observer = new ResizeObserver(position);
        if (button.current)
            observer.observe(button.current);
        if (panel.current)
            observer.observe(panel.current);
        window.addEventListener('resize', position);
        window.addEventListener('scroll', position, true);
        return () => { observer.disconnect(); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
    }, [open, wide, narrow, data, period]);
    const stale = failed || data?.stale;
    const ago = data?.syncedAt ? Math.max(0, Math.floor((Date.now() - data.syncedAt) / 60000)) : null;
    const subtitle = stale ? '同步暂不可用 · 数据可能已过期' : data?.error ?? (ago === null ? '尚未同步' : ago === 0 ? '刚刚同步' : `${ago} 分钟前同步`);
    const toggle = () => { const p = panel.current; if (!p)
        return; if (p.matches(':popover-open')) {
        p.hidePopover();
        return;
    } p.showPopover(); position(); p.querySelector<HTMLButtonElement>('button')?.focus(); };
    return <div ref={root} className="dmu-root">
        <button ref={button} type="button" className="dmu-trigger" aria-label={`用量统计，今日 ${exact(data?.today.total ?? null)} 个 Token${stale ? '，数据已过期' : ''}`} aria-expanded={open} aria-controls={id} aria-haspopup="dialog" title={`今日 ${exact(data?.today.total ?? null)} 个 Token`} onClick={toggle}><Icon />{wide && !narrow && <><span className="dmu-trigger-label">今日用量</span><span className="dmu-trigger-number">{compact(data?.today.total ?? null)}</span></>}{stale && <i className="dmu-stale-dot"/>}</button>
        {createPortal(<div ref={panel} id={id} popover="auto" className="dmu-card" role="dialog" aria-label="用量统计">
            <header><span className="dmu-title-icon"><Icon /></span><h2>用量统计</h2><span className="dmu-local">本机统计</span><button className={`dmu-refresh ${loading ? 'dmu-spinning' : ''}`} onClick={() => void refresh()} disabled={loading} aria-label="刷新用量" title="刷新用量"><Icon refresh/></button></header>
            {!data && loading ? <div className="dmu-skeleton" aria-label="正在加载用量"><i /><i /><i /></div> : <>
                <section className="dmu-today"><div className="dmu-eyebrow">今日用量</div><div className="dmu-big">{exact(data?.today.total ?? null)}</div><div className="dmu-subtle">个 Token</div><div className="dmu-breakdown"><div><span>输入</span><strong>{compact(data?.today.input ?? null)}</strong></div><div><span>输出</span><strong>{compact(data?.today.output ?? null)}</strong></div></div>{data?.today.total === null && <p className="dmu-empty">{data.today.missing ? '部分调用未返回可靠用量' : '今天暂无用量记录'}</p>}</section>
                <section className="dmu-month"><span className="dmu-eyebrow">本月累计</span><span><strong>{compact(data?.month.total ?? null)}</strong> <small>Token</small></span></section>
                {data && <ModelList models={data.models} period={period} setPeriod={setPeriod}/>}
                <section className="dmu-activity">{data ? <Heatmap days={data.days} today={data.today.date}/> : <p className="dmu-empty">暂时无法获取用量，请尝试刷新</p>}</section>
            </>}
            <footer aria-live="polite"><span className={stale ? 'dmu-status dmu-status-stale' : 'dmu-status'}/><span>{loading && data ? '正在同步…' : subtitle}</span></footer>
        </div>, document.body)}
    </div>;
}
