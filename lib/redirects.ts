import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import net from "node:net";

export type RedirectError = "timeout" | "blocked_ip" | "dns" | "bad_scheme" | "bad_port" | "too_many_hops" | "network";
export type RedirectResult = { final_url: string | null; hops: number; error: RedirectError | null };
export type FollowOptions = {
  maxHops?: number;
  timeoutMs?: number;
  isBlockedIp?: (ip: string) => boolean;
  allowedPorts?: number[];
};

const UA = "Mozilla/5.0 (compatible; RakattintsakBot/1.0)";
const REDIRECT = new Set([301, 302, 303, 307, 308]);

const blockList = new net.BlockList();
for (const [a, p] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blockList.addSubnet(a, p, "ipv4");
// ::/96 covers ::, ::1 and the deprecated IPv4-compatible form (::a.b.c.d).
for (const [a, p] of [["::", 96], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["2001:db8::", 32], ["64:ff9b::", 96]] as const)
  blockList.addSubnet(a, p, "ipv6");

/** IPv4-mapped IPv6 (::ffff:a.b.c.d, ::ffff:7f00:1) is matched against the IPv4 rules by BlockList itself. */
export function isBlockedIp(ip: string): boolean {
  const v = net.isIP(ip);
  return v === 0 || blockList.check(ip, v === 4 ? "ipv4" : "ipv6");
}

type Hop = { error: RedirectError } | { location: string | null };

function head(u: URL, timeoutMs: number, blocked: (ip: string) => boolean): Promise<Hop> {
  return new Promise((resolve) => {
    let lookupError: RedirectError | null = null;
    let done = false;
    const settle = (h: Hop) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(h);
    };
    // Resolve once, check every address, connect to exactly those: no second resolution to rebind.
    const lookup: net.LookupFunction = (host, opts, cb) =>
      dns.lookup(host, { all: true }, (err, addrs) => {
        if (err || !addrs.length) lookupError = "dns";
        else if (addrs.some((a) => blocked(a.address))) lookupError = "blocked_ip";
        if (lookupError) return cb(Object.assign(new Error(lookupError), { code: lookupError }), []);
        const fit = opts.family ? addrs.filter((a) => a.family === opts.family) : addrs;
        if (opts.all) cb(null, fit);
        else if (fit[0]) cb(null, fit[0].address, fit[0].family);
        else cb(Object.assign(new Error("dns"), { code: "ENOTFOUND" }), []);
      });
    const req = (u.protocol === "https:" ? https : http).request({
      method: "HEAD",
      protocol: u.protocol,
      hostname: u.hostname.replace(/^\[|\]$/g, ""),
      port: u.port || undefined,
      path: u.pathname + u.search,
      headers: { "User-Agent": UA, Accept: "*/*" },
      agent: false,
      lookup,
    });
    const timer = setTimeout(() => {
      settle({ error: "timeout" });
      req.destroy();
    }, timeoutMs);
    req.on("response", (res) => {
      res.destroy();
      const loc = res.headers.location;
      settle({ location: REDIRECT.has(res.statusCode ?? 0) && loc ? loc : null });
    });
    req.on("error", () => settle({ error: lookupError ?? "network" }));
    req.end();
  });
}

export async function followRedirects(url: string, opts: FollowOptions = {}): Promise<RedirectResult> {
  const { maxHops = 5, timeoutMs = 3000, isBlockedIp: blocked = isBlockedIp, allowedPorts = [80, 443] } = opts;
  let reached: string | null = null;
  let hops = 0;
  let next = url;
  const fail = (error: RedirectError): RedirectResult => ({ final_url: reached, hops, error });
  for (let i = 0; ; i++) {
    let u: URL;
    try {
      u = new URL(next, reached ?? undefined);
    } catch {
      return fail("bad_scheme");
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return fail("bad_scheme");
    const host = u.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(host) && blocked(host)) return fail("blocked_ip");
    if (!allowedPorts.includes(Number(u.port || (u.protocol === "https:" ? 443 : 80)))) return fail("bad_port");
    const r = await head(u, timeoutMs, blocked);
    if ("error" in r) return fail(r.error);
    reached = u.href;
    hops = i;
    if (!r.location) return { final_url: reached, hops, error: null };
    if (i >= maxHops) return fail("too_many_hops");
    next = r.location;
  }
}
