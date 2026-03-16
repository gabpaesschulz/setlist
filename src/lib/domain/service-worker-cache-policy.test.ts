import { beforeEach, describe, expect, it, vi } from "vitest";

type ListenerMap = Record<string, Array<(event: unknown) => void>>;

function createServiceWorkerContext() {
  const listeners: ListenerMap = {};

  const selfMock = {
    location: { origin: "https://setlist.local" },
    origin: "https://setlist.local",
    addEventListener: vi.fn((type: string, listener: (event: unknown) => void) => {
      listeners[type] ??= [];
      listeners[type].push(listener);
    }),
    skipWaiting: vi.fn(),
    clients: {
      claim: vi.fn(),
      matchAll: vi.fn().mockResolvedValue([]),
      openWindow: vi.fn(),
    },
  };

  vi.stubGlobal("self", selfMock);
  return { selfMock, listeners };
}

describe("service worker cache policy (unit)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("permite cache para GET same-origin com destino suportado", async () => {
    const { selfMock } = createServiceWorkerContext();
    await import("../../../public/sw.js");
    const internals = (selfMock as typeof selfMock & { __SW_INTERNALS__: Record<string, (...args: unknown[]) => unknown> }).__SW_INTERNALS__;

    const allowed = internals.shouldHandleRequest(
      new Request("https://setlist.local/events", { method: "GET" }),
    );

    expect(allowed).toBe(true);
  });

  it("bloqueia requests de origem externa e rotas proibidas", async () => {
    const { selfMock } = createServiceWorkerContext();
    await import("../../../public/sw.js");
    const internals = (selfMock as typeof selfMock & { __SW_INTERNALS__: Record<string, (...args: unknown[]) => unknown> }).__SW_INTERNALS__;

    expect(
      internals.shouldHandleRequest(new Request("https://externo.com/events", { method: "GET" })),
    ).toBe(false);
    expect(
      internals.shouldHandleRequest(new Request("https://setlist.local/api/events", { method: "GET" })),
    ).toBe(false);
  });

  it("trata edge cases de destination e resposta cacheável", async () => {
    const { selfMock } = createServiceWorkerContext();
    await import("../../../public/sw.js");
    const internals = (selfMock as typeof selfMock & { __SW_INTERNALS__: Record<string, (...args: unknown[]) => unknown> }).__SW_INTERNALS__;

    expect(internals.isCacheableDestination("")).toBe(true);
    expect(internals.isCacheableDestination("video")).toBe(false);
    expect(internals.shouldCacheResponse({ ok: true, type: "basic" })).toBe(true);
    expect(internals.shouldCacheResponse({ ok: false, type: "basic" })).toBe(false);
    expect(internals.shouldCacheResponse({ ok: true, type: "opaque" })).toBe(false);
  });
});
