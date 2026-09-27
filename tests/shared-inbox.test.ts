import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSharedPayload, combineSharedText, peekSharedPayload } from "@/lib/shared-inbox";

describe("combineSharedText", () => {
  it("összefűzi a címet, szöveget és linket", () => {
    expect(combineSharedText({ title: "Posta", text: "Csomagod vár", url: "https://x.hu", image: null })).toBe(
      "Posta\nCsomagod vár\nhttps://x.hu",
    );
  });
  it("nem ismétli a szövegben már szereplő linket", () => {
    expect(
      combineSharedText({ title: "", text: "Kattints: https://x.hu/a", url: "https://x.hu/a", image: null }),
    ).toBe("Kattints: https://x.hu/a");
  });
});

// A service worker (public/sw.js) ugyanígy tárolja: rakattintsak-share-v1 / "/__shared/text" és "/__shared/image".
function fakeCacheStorage() {
  const stores = new Map<string, Map<string, Response>>();
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      match: async (key: string) => store.get(key)?.clone(),
      put: async (key: string, res: Response) => void store.set(key, res),
      delete: async (key: string) => store.delete(key),
    };
  };
  return { open, stores };
}

async function share(fake: ReturnType<typeof fakeCacheStorage>, withImage: boolean) {
  const cache = await fake.open("rakattintsak-share-v1");
  await cache.put("/__shared/text", new Response(JSON.stringify({ title: "", text: "Csomagod vár", url: "" })));
  if (withImage) await cache.put("/__shared/image", new Response(new Blob(["kep"], { type: "image/png" })));
}

describe("megosztott tartalom a Cache API-ban", () => {
  let fake: ReturnType<typeof fakeCacheStorage>;
  beforeEach(() => {
    fake = fakeCacheStorage();
    vi.stubGlobal("caches", fake);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("a peek nem törli: sikertelen ellenőrzés után újra kiolvasható", async () => {
    await share(fake, true);
    const first = await peekSharedPayload();
    const second = await peekSharedPayload();
    expect(first?.text).toBe("Csomagod vár");
    expect(second?.text).toBe("Csomagod vár");
    expect(await second?.image?.text()).toBe("kep");
  });

  it("kép nélkül image: null", async () => {
    await share(fake, false);
    expect((await peekSharedPayload())?.image).toBeNull();
  });

  it("a clear után semmi nem marad (szöveg és kép sem)", async () => {
    await share(fake, true);
    await clearSharedPayload();
    expect(await peekSharedPayload()).toBeNull();
    const cache = await fake.open("rakattintsak-share-v1");
    expect(await cache.match("/__shared/image")).toBeUndefined();
  });

  it("üres tárolónál null, és a clear sem dob", async () => {
    expect(await peekSharedPayload()).toBeNull();
    await expect(clearSharedPayload()).resolves.toBeUndefined();
  });

  it("Cache API nélkül null, a clear nem dob", async () => {
    vi.unstubAllGlobals();
    expect(await peekSharedPayload()).toBeNull();
    await expect(clearSharedPayload()).resolves.toBeUndefined();
  });
});
