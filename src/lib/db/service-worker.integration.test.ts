import { beforeEach, describe, expect, it, vi } from "vitest";

type CacheEntry = Map<string, Response>;
type ListenerMap = Record<string, Array<(event: unknown) => void>>;

function createCacheMocks(origin: string) {
  const buckets = new Map<string, CacheEntry>();

  const getBucket = (name: string) => {
    if (!buckets.has(name)) buckets.set(name, new Map());
    return buckets.get(name)!;
  };

  const toUrl = (input: RequestInfo | URL) => {
    if (typeof input === "string") {
      return input.startsWith("http") ? input : `${origin}${input}`;
    }
    if (input instanceof URL) return input.toString();
    return input.url;
  };

  const cachesMock = {
    open: vi.fn(async (name: string) => {
      const bucket = getBucket(name);
      return {
        addAll: vi.fn(async (paths: string[]) => {
          paths.forEach((path) => {
            bucket.set(`${origin}${path}`, new Response(`static:${path}`, { status: 200 }));
          });
        }),
        put: vi.fn(async (request: Request, response: Response) => {
          bucket.set(request.url, response.clone());
        }),
        keys: vi.fn(async () => Array.from(bucket.keys()).map((key) => new Request(key))),
        delete: vi.fn(async (request: Request) => bucket.delete(request.url)),
      };
    }),
    keys: vi.fn(async () => Array.from(buckets.keys())),
    delete: vi.fn(async (name: string) => buckets.delete(name)),
    match: vi.fn(async (input: RequestInfo | URL) => {
      const key = toUrl(input);
      for (const bucket of buckets.values()) {
        const response = bucket.get(key);
        if (response) return response.clone();
      }
      return undefined;
    }),
  };

  return { cachesMock, buckets };
}

function createServiceWorkerContext() {
  const origin = "https://setlist.local";
  const listeners: ListenerMap = {};
  const { cachesMock, buckets } = createCacheMocks(origin);

  const selfMock = {
    location: { origin },
    origin,
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
  vi.stubGlobal("caches", cachesMock);

  return { origin, listeners, selfMock, cachesMock, buckets };
}

describe("service worker integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("usa stale-while-revalidate para recursos cacheáveis", async () => {
    const { listeners, origin, buckets } = createServiceWorkerContext();
    const fetchMock = vi.fn(async () => new Response("network-v1", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await import("../../../public/sw.js");

    const fetchListener = listeners.fetch[0];
    const request = new Request(`${origin}/events`, { method: "GET" });
    let responsePromise: Promise<Response> | undefined;

    fetchListener({
      request,
      respondWith: (response: Promise<Response>) => {
        responsePromise = response;
      },
    });

    const firstResponse = await responsePromise;
    expect(await firstResponse.text()).toBe("network-v1");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValueOnce(new Response("network-v2", { status: 200 }));
    fetchListener({
      request,
      respondWith: (response: Promise<Response>) => {
        responsePromise = response;
      },
    });
    const cachedResponse = await responsePromise;
    expect(await cachedResponse.text()).toBe("network-v1");

    await Promise.resolve();
    const runtimeBucket = buckets.get("setlist-runtime-v2");
    expect(runtimeBucket?.has(`${origin}/events`)).toBe(true);
  });

  it("faz fallback para cache quando navegação falha na rede", async () => {
    const { listeners, origin, cachesMock } = createServiceWorkerContext();
    vi.stubGlobal("fetch", vi.fn());
    await import("../../../public/sw.js");

    const runtimeCache = await cachesMock.open("setlist-runtime-v2");
    await runtimeCache.put(
      new Request(`${origin}/insights`, { method: "GET" }),
      new Response("cached-insights", { status: 200 }),
    );
    const fetchMock = vi.fn(async () => {
      throw new Error("offline");
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = {
      url: `${origin}/insights`,
      method: "GET",
      mode: "navigate",
      destination: "document",
    } as Request;
    let responsePromise: Promise<Response> | undefined;
    listeners.fetch[0]({
      request,
      respondWith: (response: Promise<Response>) => {
        responsePromise = response;
      },
    });

    const fallback = await responsePromise;
    expect(await fallback.text()).toBe("cached-insights");
  });

  it("não intercepta origem externa ou caminhos proibidos", async () => {
    const { listeners } = createServiceWorkerContext();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200 })));
    await import("../../../public/sw.js");

    const respondWithExternal = vi.fn();
    listeners.fetch[0]({
      request: new Request("https://externo.com/events", { method: "GET" }),
      respondWith: respondWithExternal,
    });
    expect(respondWithExternal).not.toHaveBeenCalled();

    const respondWithApi = vi.fn();
    listeners.fetch[0]({
      request: new Request("https://setlist.local/api/events", { method: "GET" }),
      respondWith: respondWithApi,
    });
    expect(respondWithApi).not.toHaveBeenCalled();
  });

  it("faz pre-cache no install e remove caches antigos no activate", async () => {
    const { listeners, cachesMock, selfMock, buckets } = createServiceWorkerContext();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200 })));
    await import("../../../public/sw.js");

    let installPromise: Promise<unknown> | undefined;
    listeners.install[0]({
      waitUntil: (promise: Promise<unknown>) => {
        installPromise = promise;
      },
    });
    await installPromise;
    expect(selfMock.skipWaiting).toHaveBeenCalledTimes(1);
    expect(buckets.get("setlist-static-v2")?.has("https://setlist.local/")).toBe(true);

    buckets.set("legacy-cache-v1", new Map([["https://setlist.local/legacy", new Response("legacy")]]));
    let activatePromise: Promise<unknown> | undefined;
    listeners.activate[0]({
      waitUntil: (promise: Promise<unknown>) => {
        activatePromise = promise;
      },
    });
    await activatePromise;

    expect(cachesMock.delete).toHaveBeenCalledWith("legacy-cache-v1");
    expect(selfMock.clients.claim).toHaveBeenCalledTimes(1);
  });

  it("retorna undefined quando stale-while-revalidate falha sem cache", async () => {
    const { listeners, origin } = createServiceWorkerContext();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    await import("../../../public/sw.js");

    let responsePromise: Promise<Response | undefined> | undefined;
    listeners.fetch[0]({
      request: new Request(`${origin}/settings`, { method: "GET" }),
      respondWith: (response: Promise<Response | undefined>) => {
        responsePromise = response;
      },
    });

    await expect(responsePromise).resolves.toBeUndefined();
  });

  it("foca aba existente ao clicar na notificação", async () => {
    const { listeners, selfMock } = createServiceWorkerContext();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200 })));
    const focus = vi.fn(async () => undefined);
    const navigate = vi.fn(async () => undefined);
    selfMock.clients.matchAll.mockResolvedValue([
      { url: "https://setlist.local/events", focus, navigate },
    ]);
    await import("../../../public/sw.js");

    let waitPromise: Promise<unknown> | undefined;
    const close = vi.fn();
    listeners.notificationclick[0]({
      notification: { data: { url: "/events" }, close },
      waitUntil: (promise: Promise<unknown>) => {
        waitPromise = promise;
      },
    });

    await waitPromise;
    expect(close).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/events");
    expect(selfMock.clients.openWindow).not.toHaveBeenCalled();
  });

  it("abre nova aba quando não existe cliente ativo na notificação", async () => {
    const { listeners, selfMock } = createServiceWorkerContext();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200 })));
    selfMock.clients.matchAll.mockResolvedValue([]);
    await import("../../../public/sw.js");

    let waitPromise: Promise<unknown> | undefined;
    listeners.notificationclick[0]({
      notification: { data: {}, close: vi.fn() },
      waitUntil: (promise: Promise<unknown>) => {
        waitPromise = promise;
      },
    });

    await waitPromise;
    expect(selfMock.clients.openWindow).toHaveBeenCalledWith("/");
  });
});
