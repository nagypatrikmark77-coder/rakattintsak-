import http from "node:http";
import dns from "node:dns";
import type { AddressInfo } from "node:net";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { followRedirects, isBlockedIp } from "@/lib/redirects";

const CODES = [301, 302, 303, 307, 308];
const methods: string[] = [];
let port = 0;
let base = "";
let server: http.Server;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    methods.push(req.method ?? "");
    const path = req.url ?? "/";
    const chain = path.match(/^\/chain\/(\d+)$/);
    const go = (loc: string, code = 302) => res.writeHead(code, { Location: loc }).end();
    if (chain) {
      const n = Number(chain[1]);
      return n > 0 ? go(`${base}/chain/${n - 1}`, CODES[n % CODES.length]) : res.writeHead(200).end();
    }
    if (path === "/hang") return;
    if (path === "/rel/start") return go("../done?x=1");
    if (path === "/done?x=1") return res.writeHead(200).end();
    if (path === "/file") return go("file:///etc/passwd");
    if (path === "/otherport") return go(`http://127.0.0.1:${port + 1}/`);
    if (path === "/to405") return go("/405", 301);
    if (path === "/405") return res.writeHead(405, { Allow: "GET" }).end();
    if (path === "/to-hang") return go("/hang");
    if (path === "/to-internal") return go("http://10.0.0.1/");
    if (path === "/to-localhost") return go(`http://localhost:${port}/chain/0`);
    res.writeHead(404).end();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  port = (server.address() as AddressInfo).port;
  base = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  expect(methods.length).toBeGreaterThan(0);
  expect(new Set(methods)).toEqual(new Set(["HEAD"]));
});

afterEach(() => vi.restoreAllMocks());

const open = () => ({ isBlockedIp: () => false, allowedPorts: [port] });
const loopbackOnly = () => ({ isBlockedIp: (ip: string) => ip !== "127.0.0.1" && isBlockedIp(ip), allowedPorts: [port] });

describe("followRedirects", () => {
  it("követ egy 3 ugrásos 301/302 láncot", async () => {
    expect(await followRedirects(`${base}/chain/3`, open())).toEqual({
      final_url: `${base}/chain/0`,
      hops: 3,
      error: null,
    });
  });

  it("feloldja a relatív Location-t", async () => {
    expect(await followRedirects(`${base}/rel/start`, open())).toEqual({
      final_url: `${base}/done?x=1`,
      hops: 1,
      error: null,
    });
  });

  it("5 ugrás még belefér (303/307/308 is), 6 és 7 már too_many_hops, a 6. célt le sem kéri", async () => {
    expect(await followRedirects(`${base}/chain/5`, open())).toEqual({ final_url: `${base}/chain/0`, hops: 5, error: null });
    const before = methods.length;
    expect(await followRedirects(`${base}/chain/6`, open())).toEqual({
      final_url: `${base}/chain/1`,
      hops: 5,
      error: "too_many_hops",
    });
    expect(methods.length - before).toBe(6);
    expect(await followRedirects(`${base}/chain/7`, open())).toMatchObject({ hops: 5, error: "too_many_hops" });
  });

  it("timeout, ha a szerver nem válaszol", async () => {
    const t = Date.now();
    expect(await followRedirects(`${base}/hang`, { ...open(), timeoutMs: 200 })).toEqual({
      final_url: null,
      hops: 0,
      error: "timeout",
    });
    expect(Date.now() - t).toBeLessThan(1500);
  });

  it("hibánál az utolsó elért URL-t adja vissza", async () => {
    expect(await followRedirects(`${base}/to-hang`, { ...open(), timeoutMs: 200 })).toEqual({
      final_url: `${base}/to-hang`,
      hops: 0,
      error: "timeout",
    });
  });

  it("bad_scheme: file:// Location és nem http kiinduló URL", async () => {
    expect(await followRedirects(`${base}/file`, open())).toEqual({ final_url: `${base}/file`, hops: 0, error: "bad_scheme" });
    expect(await followRedirects("ftp://example.com/", open())).toEqual({ final_url: null, hops: 0, error: "bad_scheme" });
    expect(await followRedirects("nem url", open())).toEqual({ final_url: null, hops: 0, error: "bad_scheme" });
  });

  it("bad_port: nem engedett portra mutató Location", async () => {
    expect(await followRedirects(`${base}/otherport`, open())).toEqual({
      final_url: `${base}/otherport`,
      hops: 0,
      error: "bad_port",
    });
  });

  it("405-nél megáll, hiba nélkül, GET-re nem vált", async () => {
    const before = methods.length;
    expect(await followRedirects(`${base}/to405`, open())).toEqual({ final_url: `${base}/405`, hops: 1, error: null });
    expect(methods.slice(before)).toEqual(["HEAD", "HEAD"]);
  });

  it("alapbeállítással a 127.0.0.1 blokkolt, a szerver egy kérést sem kap", async () => {
    const before = methods.length;
    expect(await followRedirects(`${base}/chain/0`)).toEqual({ final_url: null, hops: 0, error: "blocked_ip" });
    expect(await followRedirects(`http://[::1]:${port}/`)).toEqual({ final_url: null, hops: 0, error: "blocked_ip" });
    expect(methods.length).toBe(before);
  });

  it("a localhost névfeloldás után, csatlakozáskor blokkolt", async () => {
    const before = methods.length;
    expect(await followRedirects("http://localhost/")).toEqual({ final_url: null, hops: 0, error: "blocked_ip" });
    expect(await followRedirects("https://localhost/")).toEqual({ final_url: null, hops: 0, error: "blocked_ip" });
    expect(await followRedirects(`http://localhost:${port}/chain/0`, { allowedPorts: [port] })).toEqual({
      final_url: null,
      hops: 0,
      error: "blocked_ip",
    });
    expect(methods.length).toBe(before);
  });

  it("belső címre mutató átirányítás blokkolt (IP-literál és hostnév)", async () => {
    expect(await followRedirects(`${base}/to-internal`, loopbackOnly())).toEqual({
      final_url: `${base}/to-internal`,
      hops: 0,
      error: "blocked_ip",
    });
    // localhost -> 127.0.0.1 ÉS ::1; ha bármelyik blokkolt, az egész blokkolt
    expect(await followRedirects(`${base}/to-localhost`, loopbackOnly())).toEqual({
      final_url: `${base}/to-localhost`,
      hops: 0,
      error: "blocked_ip",
    });
  });

  it("ha a DNS bármelyik címe blokkolt, nem csatlakozik", async () => {
    const spy = vi.spyOn(dns, "lookup").mockImplementation(((_h: string, _o: unknown, cb: (...a: unknown[]) => void) =>
      cb(null, [
        { address: "127.0.0.1", family: 4 },
        { address: "10.0.0.1", family: 4 },
      ])) as never);
    const before = methods.length;
    // Itt csak a 127.0.0.1 "engedett": egy hibás őr a helyi szerverre csatlakozna, nem az internetre.
    const opts = { isBlockedIp: (ip: string) => ip !== "127.0.0.1", allowedPorts: [port] };
    expect(await followRedirects(`http://rebind.example:${port}/chain/0`, opts)).toEqual({
      final_url: null,
      hops: 0,
      error: "blocked_ip",
    });
    expect(spy).toHaveBeenCalled();
    expect(methods.length).toBe(before);
  });

  it("dns hiba", async () => {
    vi.spyOn(dns, "lookup").mockImplementation(((_h: string, _o: unknown, cb: (...a: unknown[]) => void) =>
      cb(Object.assign(new Error("nope"), { code: "ENOTFOUND" }))) as never);
    expect(await followRedirects("http://nincs.example/")).toEqual({ final_url: null, hops: 0, error: "dns" });
  });

  it("network hiba zárt portra", async () => {
    const tmp = http.createServer();
    await new Promise<void>((r) => tmp.listen(0, "127.0.0.1", r));
    const closed = (tmp.address() as AddressInfo).port;
    await new Promise((r) => tmp.close(r));
    expect(await followRedirects(`http://127.0.0.1:${closed}/`, { isBlockedIp: () => false, allowedPorts: [closed] })).toEqual({
      final_url: null,
      hops: 0,
      error: "network",
    });
  });
});

describe("isBlockedIp", () => {
  const cases: [string, boolean][] = [
    ["8.8.8.8", false],
    ["1.1.1.1", false],
    ["2a00:1450:4001::1", false],
    ["93.184.216.34", false],
    ["0.0.0.0", true],
    ["10.1.2.3", true],
    ["100.64.0.1", true],
    ["100.127.255.255", true],
    ["100.128.0.1", false],
    ["127.0.0.1", true],
    ["169.254.169.254", true],
    ["172.16.0.1", true],
    ["172.31.255.255", true],
    ["172.32.0.1", false],
    ["192.0.0.8", true],
    ["192.0.2.1", true],
    ["192.168.1.1", true],
    ["198.18.0.1", true],
    ["198.19.255.255", true],
    ["198.51.100.7", true],
    ["203.0.113.9", true],
    ["224.0.0.1", true],
    ["239.255.255.255", true],
    ["240.0.0.1", true],
    ["255.255.255.255", true],
    ["::", true],
    ["::1", true],
    ["fc00::1", true],
    ["fd12:3456::1", true],
    ["fe80::1", true],
    ["ff02::1", true],
    ["2001:db8::1", true],
    ["64:ff9b::a00:1", true],
    ["::ffff:127.0.0.1", true],
    ["::ffff:10.0.0.1", true],
    ["::ffff:7f00:1", true],
    ["::ffff:8.8.8.8", false],
    ["", true],
    ["nem-ip", true],
    ["999.1.1.1", true],
  ];
  it.each(cases)("%s → %s", (ip, want) => expect(isBlockedIp(ip)).toBe(want));
});
