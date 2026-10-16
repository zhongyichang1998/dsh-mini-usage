// src/index.ts
import { homedir } from "node:os";
import { join } from "node:path";

// src/collector.ts
import { mkdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import { dirname } from "node:path";

// src/usage.ts
var zero = () => ({ input: 0, output: 0, samples: 0, missing: 0 });
var unknownModel = () => ({ provider: null, model: null });
var modelKey = (identity) => JSON.stringify([identity.provider, identity.model]);
var dayKey = (time) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
var newFold = (inherited = 0) => ({ next: inherited, inherited, days: {}, models: /* @__PURE__ */ Object.create(null), route: unknownModel(), last: null, anchor: "" });
var fingerprint = (e) => JSON.stringify([e.seq, e.type, e.time, e.data.turn, e.data.step]);
var valid = (n) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
var identifier = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 256 ? value : null;
function sample(u) {
  if (!u || !valid(u.inputTokens) || !valid(u.outputTokens) || u.cacheReadTokens !== void 0 && !valid(u.cacheReadTokens) || u.cacheWriteTokens !== void 0 && !valid(u.cacheWriteTokens))
    return { ...zero(), missing: 1 };
  const input = u.inputTokens + (u.cacheReadTokens ?? 0) + (u.cacheWriteTokens ?? 0);
  if (!valid(input + u.outputTokens) || u.totalTokens !== void 0 && (!valid(u.totalTokens) || u.totalTokens !== input + u.outputTokens))
    return { ...zero(), missing: 1 };
  return { input, output: u.outputTokens, samples: 1, missing: 0 };
}
function add(to, from, sign = 1) {
  for (const k of ["input", "output", "samples", "missing"])
    to[k] += from[k] * sign;
}
function attributedModel(event, route) {
  const source = event.data.message?.source;
  const model = identifier(source?.model), provider = identifier(source?.provider);
  if (model !== null)
    return { model, provider };
  if (provider !== null && provider !== route.provider)
    return { provider, model: null };
  return { ...route };
}
function addModel(state, identity, day, bucket) {
  const id = modelKey(identity);
  const entry = state.models[id] ??= { ...identity, days: {} };
  add(entry.days[day] ??= zero(), bucket);
  return id;
}
function removeModel(state, previous) {
  add(state.models[previous.modelKey].days[previous.day], previous.bucket, -1);
}
function foldEvents(state, events) {
  for (const event of events) {
    if (event.seq < state.next)
      continue;
    if (event.seq !== state.next || !Number.isFinite(event.time) || Number.isNaN(new Date(event.time).getTime()))
      throw new Error("Invalid event sequence");
    const { turn, step } = event.data;
    const key = `${turn}:${step}`;
    if (event.type === "request/header") {
      const config = event.data.header?.config;
      state.route = { provider: identifier(config?.provider), model: identifier(config?.model) };
    }
    if (event.type === "compaction/summary" && event.data.llmStreamCall === true) {
      const day = dayKey(event.time), bucket = { ...zero(), missing: 1 };
      add(state.days[day] ??= zero(), bucket);
      addModel(state, unknownModel(), day, bucket);
    }
    if (event.type === "llm/retry-started" && state.last?.key === key)
      state.last = null;
    if (event.type === "assistant/message" || event.type === "assistant/attempt") {
      if (!valid(turn) || !valid(step))
        throw new Error("Invalid settlement");
      let usage = event.type === "assistant/message" ? event.data.usage : void 0;
      if (!usage) {
        const stream = event.data.stream ?? [];
        for (let i = stream.length - 1; i >= 0; i--) {
          if (stream[i].type === "chunk" && stream[i].chunk?.type === "usage") {
            usage = stream[i].chunk?.usage;
            break;
          }
        }
      }
      const bucket = sample(usage);
      const signature = bucket.samples ? JSON.stringify([usage.inputTokens, usage.outputTokens, usage.cacheReadTokens ?? 0, usage.cacheWriteTokens ?? 0]) : "missing";
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
      } else if (previous.modelKey !== modelKey(identity)) {
        removeModel(state, previous);
        state.last = { ...previous, modelKey: addModel(state, identity, previous.day, previous.bucket) };
      }
    }
    state.next = event.seq + 1;
    state.anchor = fingerprint(event);
  }
}
function toDay(date, bucket = zero()) {
  const known = bucket.samples > 0 && bucket.missing === 0;
  return { date, input: known ? bucket.input : null, output: known ? bucket.output : null, total: known ? bucket.input + bucket.output : null, samples: bucket.samples, missing: bucket.missing };
}
function summarize(states, now = Date.now(), syncedAt = now) {
  const buckets = {};
  const today = dayKey(now), monthKey = today.slice(0, 7), month = zero();
  const todayModels = /* @__PURE__ */ new Map(), monthModels = /* @__PURE__ */ new Map();
  const collectModel = (map, id, entry, bucket) => {
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
  const renderModels = (map, period) => [...map.entries()].filter(([, entry]) => entry.days.total.samples + entry.days.total.missing > 0).map(([id, entry]) => ({ id, model: entry.model, provider: entry.provider, ...toDay(period, entry.days.total) })).sort((a, b) => a.model === null && b.model !== null ? 1 : a.model !== null && b.model === null ? -1 : `${a.model ?? ""}/${a.provider ?? ""}`.localeCompare(`${b.model ?? ""}/${b.provider ?? ""}`, "en"));
  const start = new Date(now);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7 - 77);
  const days = [];
  for (let i = 0; i < 84; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = dayKey(d.getTime());
    days.push(date > today ? { ...toDay(date), future: true } : toDay(date, buckets[date]));
  }
  return { today: toDay(today, buckets[today]), month: toDay(monthKey, month), days, models: { today: renderModels(todayModels, today), month: renderModels(monthModels, monthKey) }, syncedAt, stale: false, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, sessions: Object.keys(states).length };
}

// src/collector.ts
var zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
function validFold(x) {
  const integer = (v) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
  const identity = (v) => !!v && [v.provider, v.model].every((s) => s === null || typeof s === "string" && s.length > 0 && s.length <= 256);
  const bucket = (b) => !!b && ["input", "output", "samples", "missing"].every((k) => integer(b[k]));
  const days = (v) => !!v && !Array.isArray(v) && Object.entries(v).every(([d, b]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && bucket(b));
  if (!x || !integer(x.next) || !integer(x.inherited) || x.next < x.inherited || typeof x.anchor !== "string" || !days(x.days) || !identity(x.route) || !x.models)
    return false;
  if (!Object.entries(x.models).every(([key, entry]) => identity(entry) && key === modelKey(entry) && days(entry.days)))
    return false;
  return x.last === null || !!x.last && typeof x.last.key === "string" && typeof x.last.signature === "string" && bucket(x.last.bucket) && !!x.days[x.last.day] && !!x.models[x.last.modelKey]?.days[x.last.day];
}
var Collector = class {
  constructor(persistence, cacheFile, now = Date.now) {
    this.persistence = persistence;
    this.cacheFile = cacheFile;
    this.now = now;
  }
  states = /* @__PURE__ */ Object.create(null);
  revisions = /* @__PURE__ */ new Map();
  // Opaque tokens are valid ONLY within this service instance.
  inflight;
  loaded = false;
  currentZone = zone();
  stopped = false;
  last;
  stop() {
    this.stopped = true;
  }
  refresh() {
    if (this.inflight)
      return this.inflight;
    this.inflight = this.collect().finally(() => {
      this.inflight = void 0;
    });
    return this.inflight;
  }
  async load() {
    this.loaded = true;
    try {
      const raw = JSON.parse(await readFile(this.cacheFile, "utf8"));
      if (raw.version === 3 && raw.zone === this.currentZone && raw.states && Object.values(raw.states).every((x) => validFold(x)) && Number.isFinite(raw.syncedAt)) {
        this.states = Object.assign(/* @__PURE__ */ Object.create(null), raw.states);
        this.last = summarize(this.states, this.now(), raw.syncedAt);
      }
    } catch {
    }
  }
  async collect() {
    if (!this.loaded)
      await this.load();
    if (this.currentZone !== zone()) {
      this.currentZone = zone();
      this.states = /* @__PURE__ */ Object.create(null);
      this.revisions.clear();
      this.last = void 0;
    }
    try {
      const listing = await this.persistence.list();
      const next = /* @__PURE__ */ Object.create(null);
      const revisions = /* @__PURE__ */ new Map();
      for (const row of listing) {
        if (this.stopped)
          throw new Error("Stopped");
        const id = row.header.id;
        if (this.revisions.get(id) === row.revision && this.states[id]) {
          next[id] = this.states[id];
          revisions.set(id, row.revision);
          continue;
        }
        const handle = await this.persistence.open(id, "read");
        try {
          let state = this.states[id] ? structuredClone(this.states[id]) : newFold(handle.inheritedEventCount);
          if (state.inherited !== handle.inheritedEventCount)
            state = newFold(handle.inheritedEventCount);
          if (state.next > state.inherited) {
            const { events } = await handle.read(state.next - 1, 1);
            if (!events[0] || fingerprint(events[0]) !== state.anchor)
              state = newFold(handle.inheritedEventCount);
          }
          for (; ; ) {
            if (this.stopped)
              throw new Error("Stopped");
            const { events } = await handle.read(state.next, 512);
            foldEvents(state, events);
            if (events.length < 512)
              break;
          }
          next[id] = state;
          revisions.set(id, row.revision);
        } finally {
          await handle.close();
        }
      }
      if (this.stopped)
        throw new Error("Stopped");
      const result = summarize(next, this.now());
      this.states = next;
      this.revisions = revisions;
      this.last = result;
      const temp = `${this.cacheFile}.${process.pid}.tmp`;
      try {
        await mkdir(dirname(this.cacheFile), { recursive: true, mode: 448 });
        await writeFile(temp, JSON.stringify({ version: 3, zone: this.currentZone, states: next, syncedAt: result.syncedAt }), { mode: 384 });
        await rename(temp, this.cacheFile);
      } catch {
        await unlink(temp).catch(() => {
        });
        return { ...result, error: "\u7528\u91CF\u5DF2\u66F4\u65B0\uFF0C\u7F13\u5B58\u6682\u65F6\u65E0\u6CD5\u4FDD\u5B58\u3002" };
      }
      return result;
    } catch {
      const result = this.last ? summarize(this.states, this.now(), this.last.syncedAt) : summarize({}, this.now(), 0);
      return { ...result, stale: true, error: "\u540C\u6B65\u5931\u8D25\uFF0C\u5DF2\u4FDD\u7559\u4E0A\u6B21\u6709\u6548\u6570\u636E\u3002" };
    }
  }
};

// src/index.ts
var name = "dsh-mini-usage";
var inject = ["webServer", "sessionPersistence"];
var endpoint = "/api/dsh-mini-usage";
function allowed(req) {
  const peer = req.socket.remoteAddress?.replace(/^::ffff:/, "");
  const loopback = peer === "::1" || /^127(?:\.\d{1,3}){3}$/.test(peer ?? "");
  try {
    const host = new URL(`http://${req.headers.host}`);
    if (!loopback || !["localhost", "127.0.0.1", "[::1]"].includes(host.hostname))
      return false;
    if (req.headers["x-dsh-mini-usage"] !== "1")
      return false;
    if (req.headers.origin && req.headers.origin !== host.origin)
      return false;
    return true;
  } catch {
    return false;
  }
}
function apply(ctx) {
  const collector = new Collector(ctx.sessionPersistence, join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "storages", "dsh-mini-usage", "index-v3.json"));
  ctx.effect(() => ctx.webServer.register({ kind: "exact", path: endpoint, handler: async (req, res) => {
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.setHeader("x-content-type-options", "nosniff");
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("{}");
      return;
    }
    if (!allowed(req)) {
      res.statusCode = 403;
      res.end("{}");
      return;
    }
    res.end(JSON.stringify(await collector.refresh()));
  } }), "dsh-mini-usage: read-only route");
  ctx.effect(() => {
    void collector.refresh();
    const timer = setInterval(() => {
      void collector.refresh();
    }, 3e5);
    timer.unref?.();
    return () => {
      clearInterval(timer);
      collector.stop();
    };
  }, "dsh-mini-usage: refresh lifecycle");
}
export {
  allowed,
  apply,
  endpoint,
  inject,
  name
};
//# sourceMappingURL=index.js.map
