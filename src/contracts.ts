/** Minimal structural adapters verified against dsh-v0.2.0-rc.2 (639ed015).
 * Deliberately no runtime import of DSH internals or authentication services. */
export interface Usage {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    totalTokens?: number;
}
export interface Event {
    seq: number;
    time: number;
    type: string;
    data: {
        turn?: number;
        step?: number;
        llmStreamCall?: boolean;
        usage?: Usage;
        header?: {
            config?: {
                provider?: string;
                model?: string;
            };
        };
        message?: {
            source?: {
                provider?: string;
                model?: string;
            };
        };
        stream?: readonly {
            type: string;
            chunk?: {
                type: string;
                usage?: Usage;
            };
        }[];
    };
}
export interface ReadHandle {
    inheritedEventCount: number;
    read(offset?: number, length?: number): Promise<{
        events: readonly Event[];
    }>;
    close(): Promise<void>;
}
export interface Persistence {
    list(): Promise<readonly {
        header: {
            id: string;
        };
        revision: string;
    }[]>;
    open(id: string, access: 'read'): Promise<ReadHandle>;
}
export interface Bucket {
    input: number;
    output: number;
    samples: number;
    missing: number;
}
export interface Day {
    date: string;
    input: number | null;
    output: number | null;
    total: number | null;
    samples: number;
    missing: number;
    future?: boolean;
}
export interface ModelIdentity {
    provider: string | null;
    model: string | null;
}
export interface ModelUsage extends Day, ModelIdentity {
    id: string;
}
export interface Snapshot {
    today: Day;
    month: Day;
    days: Day[];
    models: {
        today: ModelUsage[];
        month: ModelUsage[];
    };
    syncedAt: number;
    stale: boolean;
    error?: string;
    timeZone: string;
    sessions: number;
}
export interface HostContext {
    sessionPersistence: Persistence;
    webServer: {
        register(route: {
            kind: 'exact';
            path: string;
            handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void>;
        }): () => void;
    };
    effect(callback: () => (() => void), label?: string): unknown;
}
export interface ClientContext {
    slots: {
        inject(key: 'sidebar.footer.action', callback: () => unknown): unknown;
        register(spec: {
            name: 'sidebar.footer.action';
            id: string;
            order: number;
        }, component: React.ComponentType<{
            wide: boolean;
        }>): unknown;
    };
    effect(callback: () => (() => void), label?: string): unknown;
}
