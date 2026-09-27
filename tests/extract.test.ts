import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EXTRACT_MAX_TOKENS,
  EXTRACT_MODEL,
  ExtractError,
  extractWithClaude,
  type ExtractClient,
} from "@/lib/extract";
import { ENTITIES } from "@/lib/kb";
import { PRESSURE_TYPES, REQUEST_TYPES, type OfficialEntity } from "@/lib/types";

// ---- Hamis kliens: a valódi API-t a tesztek soha nem hívják. ----

type Body = Anthropic.MessageCreateParamsNonStreaming;
type FakeResponse = { content: Array<{ type: string; [k: string]: unknown }>; stop_reason?: string | null };

function fakeClient(result: FakeResponse | Error) {
  const calls: Body[] = [];
  const client: ExtractClient = {
    messages: {
      create: async (body) => {
        calls.push(body);
        if (result instanceof Error) throw result;
        return result as Awaited<ReturnType<ExtractClient["messages"]["create"]>>;
      },
    },
  };
  return { client, calls };
}

function toolResponse(input: unknown, stop_reason: string | null = "tool_use"): FakeResponse {
  return { content: [{ type: "tool_use", id: "toolu_1", name: "report_signals", input }], stop_reason };
}

const GLS_TEXT =
  "GLS Hungary: Csomagja nem kézbesíthető, mert 299 Ft vámkezelési díj nincs kifizetve. Fizessen 24 órán belül: https://gls-hu.csomag-info.top/fizetes";

const VALID_INPUT = {
  transcript: "(modell visszhangja, szöveges bemenetnél felülírjuk)",
  urls_verbatim: ["https://gls-hu.csomag-info.top/fizetes"],
  claimed_sender: "gls",
  requests: [{ type: "click_link", evidence: "Fizessen 24 órán belül: https://gls-hu.csomag-info.top/fizetes" }],
  pressure: [
    { type: "small_fee", evidence: "299 Ft vámkezelési díj" },
    { type: "deadline", evidence: "24 órán belül" },
  ],
  contains_code_only: false,
  instructions_to_ai: false,
  sender_number: null,
  has_attachment: false,
};

const ALL_FIELDS = [
  "transcript",
  "urls_verbatim",
  "claimed_sender",
  "requests",
  "pressure",
  "contains_code_only",
  "instructions_to_ai",
  "sender_number",
  "has_attachment",
];

async function captureRequest(input: Parameters<typeof extractWithClaude>[0], entities?: OfficialEntity[]) {
  const { client, calls } = fakeClient(toolResponse(VALID_INPUT));
  await extractWithClaude(input, { client, entities });
  expect(calls).toHaveLength(1);
  return calls[0];
}

type JsonSchema = {
  type?: string;
  enum?: string[];
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
};

function toolOf(body: Body) {
  expect(body.tools).toHaveLength(1);
  return body.tools![0] as Anthropic.Tool;
}
function schemaOf(body: Body): JsonSchema {
  return toolOf(body).input_schema as unknown as JsonSchema;
}

async function expectExtractError(p: Promise<unknown>, code: ExtractError["code"]): Promise<ExtractError> {
  const err = await p.then(
    () => {
      throw new Error("expected rejection");
    },
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ExtractError);
  expect((err as ExtractError).code).toBe(code);
  return err as ExtractError;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ---- Kérés alakja ----

describe("extractWithClaude – kérés", () => {
  it("Haiku 4.5, temperature 0, kényszerített report_signals, egyetlen hívás", async () => {
    const body = await captureRequest({ text: GLS_TEXT });
    expect(EXTRACT_MODEL).toBe("claude-haiku-4-5-20251001");
    expect(body.model).toBe(EXTRACT_MODEL);
    expect(body.temperature).toBe(0);
    expect(body.max_tokens).toBe(EXTRACT_MAX_TOKENS);
    // 5000 karakter szó szerinti visszhang + idézetek + JSON-keret, pesszimista 1 token/karakterrel is belefér.
    expect(EXTRACT_MAX_TOKENS).toBeGreaterThanOrEqual(12000);
    expect(body.tool_choice).toEqual({ type: "tool", name: "report_signals", disable_parallel_tool_use: true });
    expect(body.stream).toBeUndefined();
    expect(body.thinking).toBeUndefined();
  });

  it("strict tool séma: minden mező kötelező, additionalProperties false mindenhol", async () => {
    const body = await captureRequest({ text: GLS_TEXT });
    const tool = toolOf(body);
    expect(tool.name).toBe("report_signals");
    expect(tool.strict).toBe(true);
    const schema = schemaOf(body);
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect(Object.keys(schema.properties!).sort()).toEqual([...ALL_FIELDS].sort());
    expect([...schema.required!].sort()).toEqual([...ALL_FIELDS].sort());
    for (const key of ["requests", "pressure"]) {
      const item = schema.properties![key].items!;
      expect(schema.properties![key].type).toBe("array");
      expect(item.type).toBe("object");
      expect(item.additionalProperties).toBe(false);
      expect([...item.required!].sort()).toEqual(["evidence", "type"]);
    }
    expect(schema.properties!.urls_verbatim.items!.type).toBe("string");
    for (const key of ["contains_code_only", "instructions_to_ai", "has_attachment"]) {
      expect(schema.properties![key].type).toBe("boolean");
    }
    const senderTypes = (schema.properties!.sender_number.anyOf ?? []).map((s) => s.type).sort();
    expect(senderTypes).toEqual(["null", "string"]);
  });

  it("zárt listák: REQUEST_TYPES, PRESSURE_TYPES, minden entitás-id + egyeb + ismeretlen, definíciókkal", async () => {
    const schema = schemaOf(await captureRequest({ text: GLS_TEXT }));
    const reqType = schema.properties!.requests.items!.properties!.type;
    const presType = schema.properties!.pressure.items!.properties!.type;
    expect(reqType.enum).toEqual([...REQUEST_TYPES]);
    expect(presType.enum).toEqual([...PRESSURE_TYPES]);
    // minden enum-értékhez van egysoros definíció a leírásban
    for (const t of REQUEST_TYPES) expect(reqType.description).toContain(`${t}:`);
    for (const t of PRESSURE_TYPES) expect(presType.description).toContain(`${t}:`);
    expect(presType.description).toMatch(/secrecy_request:.*(bank|család)/);

    const sender = schema.properties!.claimed_sender;
    expect(sender.enum).toEqual([...ENTITIES.map((e) => e.id), "egyeb", "ismeretlen"]);
    for (const e of ENTITIES) expect(sender.description).toContain(`${e.id} = ${e.name}`);
    expect(sender.description).toContain("gls = GLS Hungary (GLS, GLS Hungary, GLS Csomagpont)");
    expect(sender.description).toMatch(/egyeb/);
    expect(sender.description).toMatch(/ismeretlen/);
  });

  it("a deps.entities listát használja az enumhoz", async () => {
    const custom = [{ ...ENTITIES[0], id: "tesztbank", name: "Teszt Bank", aliases: ["TB"] }];
    const schema = schemaOf(await captureRequest({ text: GLS_TEXT }, custom));
    expect(schema.properties!.claimed_sender.enum).toEqual(["tesztbank", "egyeb", "ismeretlen"]);
    expect(schema.properties!.claimed_sender.description).toContain("tesztbank = Teszt Bank (TB)");
  });

  it("szöveg: <uzenet> címkék közé csomagolva, a rendszerprompt adatnak tekinti", async () => {
    const body = await captureRequest({ text: GLS_TEXT });
    expect(body.messages).toHaveLength(1);
    const msg = body.messages[0];
    expect(msg.role).toBe("user");
    const blocks = msg.content as Anthropic.ContentBlockParam[];
    expect(blocks).toEqual([{ type: "text", text: `<uzenet>\n${GLS_TEXT}\n</uzenet>` }]);
    const system = String(body.system);
    expect(system).toMatch(/untrusted/i);
    expect(system).toContain("<uzenet>");
    expect(system).toContain("instructions_to_ai");
    expect(system).not.toContain(GLS_TEXT);
  });

  it("kép: base64 image blokk a megadott media type-pal + rövid utasítás, <uzenet> nélkül", async () => {
    const body = await captureRequest({ imageBase64: "iVBORw0KGgo=", imageMediaType: "image/png" });
    const blocks = body.messages[0].content as Anthropic.ContentBlockParam[];
    expect(blocks[0]).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: "iVBORw0KGgo=" },
    });
    expect(blocks).toHaveLength(2);
    expect(blocks[1].type).toBe("text");
    expect((blocks[1] as Anthropic.TextBlockParam).text).toContain("report_signals");
    expect(JSON.stringify(blocks)).not.toContain("<uzenet>");
  });

  it("kép: data URL előtag levágva, alapértelmezett media type image/jpeg", async () => {
    const body = await captureRequest({ imageBase64: "data:image/jpeg;base64,/9j/4AAQ" });
    const img = (body.messages[0].content as Anthropic.ContentBlockParam[])[0] as Anthropic.ImageBlockParam;
    expect(img.source).toEqual({ type: "base64", media_type: "image/jpeg", data: "/9j/4AAQ" });
  });

  it("kép + kísérőszöveg: mindkettő elmegy, a szöveg <uzenet> között", async () => {
    const body = await captureRequest({ text: "Nézd, ezt kaptam", imageBase64: "iVBORw0KGgo=", imageMediaType: "image/png" });
    const blocks = body.messages[0].content as Anthropic.ContentBlockParam[];
    expect(blocks[0].type).toBe("image");
    expect(blocks.some((b) => b.type === "text" && b.text === "<uzenet>\nNézd, ezt kaptam\n</uzenet>")).toBe(true);
  });

  it("üres bemenetre nem hív API-t", async () => {
    const { client, calls } = fakeClient(toolResponse(VALID_INPUT));
    await expect(extractWithClaude({ text: "   " }, { client })).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

// ---- Kimenet feldolgozása ----

describe("extractWithClaude – kimenet", () => {
  it("érvényes kimenet → Extraction; szövegnél a transcript az eredeti bemenet", async () => {
    const { client } = fakeClient(toolResponse(VALID_INPUT));
    const out = await extractWithClaude({ text: GLS_TEXT }, { client });
    expect(out).toEqual({ ...VALID_INPUT, transcript: GLS_TEXT });
  });

  it("képnél a modell átirata marad a transcript", async () => {
    const { client } = fakeClient(toolResponse({ ...VALID_INPUT, transcript: "GLS: fizess 299 Ft-ot" }));
    const out = await extractWithClaude({ imageBase64: "iVBORw0KGgo=", imageMediaType: "image/png" }, { client });
    expect(out.transcript).toBe("GLS: fizess 299 Ft-ot");
  });

  it("kép + kísérőszöveg: transcript = kísérőszöveg + a kép átirata", async () => {
    const { client } = fakeClient(toolResponse({ ...VALID_INPUT, transcript: "GLS: fizess 299 Ft-ot" }));
    const out = await extractWithClaude(
      { text: "Nézd, ezt kaptam", imageBase64: "iVBORw0KGgo=", imageMediaType: "image/png" },
      { client },
    );
    expect(out.transcript).toBe("Nézd, ezt kaptam\n\nGLS: fizess 299 Ft-ot");
  });

  it("érvénytelen tömbelemek kiesnek (ismeretlen enum, hiányzó/nem szöveg/üres idézet, nem objektum)", async () => {
    const { client } = fakeClient(
      toolResponse({
        ...VALID_INPUT,
        urls_verbatim: ["gls-hu.top/x", 42, "", null, "http://a.b"],
        requests: [
          { type: "click_link", evidence: "Fizessen" },
          { type: "bogus", evidence: "Fizessen" },
          { type: "card_data" },
          { type: "password", evidence: 7 },
          { type: "share_code", evidence: "" },
          null,
          "click_link",
        ],
        pressure: [{ type: "deadline", evidence: "24 órán belül" }, { type: "urgency", evidence: "24 órán belül" }],
      }),
    );
    const out = await extractWithClaude({ text: GLS_TEXT }, { client });
    expect(out.urls_verbatim).toEqual(["gls-hu.top/x", "http://a.b"]);
    expect(out.requests).toEqual([{ type: "click_link", evidence: "Fizessen" }]);
    expect(out.pressure).toEqual([{ type: "deadline", evidence: "24 órán belül" }]);
  });

  it("ismeretlen claimed_sender → ismeretlen; az egyeb/ismeretlen és a listás id marad", async () => {
    for (const [given, expected] of [
      ["amazon", "ismeretlen"],
      ["GLS", "ismeretlen"],
      ["egyeb", "egyeb"],
      ["ismeretlen", "ismeretlen"],
      ["otp", "otp"],
    ] as const) {
      const { client } = fakeClient(toolResponse({ ...VALID_INPUT, claimed_sender: given }));
      const out = await extractWithClaude({ text: GLS_TEXT }, { client });
      expect(out.claimed_sender).toBe(expected);
    }
  });

  it("sender_number: szám marad (trim), üres szöveg → null", async () => {
    const a = fakeClient(toolResponse({ ...VALID_INPUT, sender_number: " +36 70 717 7702 " }));
    expect((await extractWithClaude({ text: GLS_TEXT }, { client: a.client })).sender_number).toBe("+36 70 717 7702");
    const b = fakeClient(toolResponse({ ...VALID_INPUT, sender_number: "  " }));
    expect((await extractWithClaude({ text: GLS_TEXT }, { client: b.client })).sender_number).toBeNull();
  });

  it("nincs tool_use blokk → bad_output", async () => {
    const { client } = fakeClient({ content: [{ type: "text", text: "Ez csalás." }], stop_reason: "end_turn" });
    await expectExtractError(extractWithClaude({ text: GLS_TEXT }, { client }), "bad_output");
  });

  it("más nevű tool_use → bad_output", async () => {
    const { client } = fakeClient({
      content: [{ type: "tool_use", id: "t", name: "other_tool", input: VALID_INPUT }],
      stop_reason: "tool_use",
    });
    await expectExtractError(extractWithClaude({ text: GLS_TEXT }, { client }), "bad_output");
  });

  it("nem objektum input vagy rossz típusú kötelező mező → bad_output", async () => {
    const bad: unknown[] = [
      null,
      "szöveg",
      [VALID_INPUT],
      { ...VALID_INPUT, contains_code_only: "false" },
      { ...VALID_INPUT, instructions_to_ai: undefined },
      { ...VALID_INPUT, requests: "click_link" },
      { ...VALID_INPUT, claimed_sender: 3 },
      { ...VALID_INPUT, sender_number: 36 },
    ];
    for (const input of bad) {
      const { client } = fakeClient(toolResponse(input));
      await expectExtractError(extractWithClaude({ text: GLS_TEXT }, { client }), "bad_output");
    }
  });

  it("képnél hiányzó transcript → bad_output", async () => {
    const { client } = fakeClient(toolResponse({ ...VALID_INPUT, transcript: undefined }));
    await expectExtractError(extractWithClaude({ imageBase64: "iVBORw0KGgo=" }, { client }), "bad_output");
  });

  it("csonka válasz (stop_reason max_tokens) vagy refusal → bad_output", async () => {
    for (const stop of ["max_tokens", "refusal"]) {
      const { client } = fakeClient(toolResponse(VALID_INPUT, stop));
      await expectExtractError(extractWithClaude({ text: GLS_TEXT }, { client }), "bad_output");
    }
  });
});

// ---- Hibák és adatvédelem ----

describe("extractWithClaude – hibák", () => {
  const SECRET = "Titkos üzenet: a kártyaszámom 4111 1111 1111 1111";

  it("a kliens hibája → api_error, a bemenet nem kerül az üzenetbe", async () => {
    const { client } = fakeClient(new Error(`400 invalid request near "${SECRET}"`));
    const err = await expectExtractError(extractWithClaude({ text: SECRET }, { client }), "api_error");
    expect(err.message).not.toContain(SECRET);
    expect(err.message).not.toContain("4111");
    expect(String(err)).not.toContain("4111");
    expect(err.stack ?? "").not.toContain("4111");
    expect(err.cause).toBeUndefined();
    expect(JSON.stringify(err)).not.toContain("4111");
  });

  it("SDK APIError → api_error, a HTTP státusz megmarad, a szöveg nem", async () => {
    const apiErr = new Anthropic.RateLimitError(429, { type: "error" }, `rate limited ${SECRET}`, new Headers());
    const { client } = fakeClient(apiErr);
    const err = await expectExtractError(extractWithClaude({ text: SECRET }, { client }), "api_error");
    expect(err.status).toBe(429);
    expect(err.message).not.toContain("4111");
  });

  it("bad_output üzenete sem tartalmazza a bemenetet vagy a modell kimenetét", async () => {
    const { client } = fakeClient({ content: [{ type: "text", text: SECRET }], stop_reason: "end_turn" });
    const err = await expectExtractError(extractWithClaude({ text: SECRET }, { client }), "bad_output");
    expect(err.message).not.toContain("4111");
  });

  it("nincs ANTHROPIC_API_KEY és nincs injektált kliens → no_api_key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    await expectExtractError(extractWithClaude({ text: GLS_TEXT }), "no_api_key");
    vi.stubEnv("ANTHROPIC_API_KEY", undefined);
    await expectExtractError(extractWithClaude({ text: GLS_TEXT }), "no_api_key");
  });

  it("semmit nem ír a konzolra (siker és hiba esetén sem)", async () => {
    const spies = (["log", "info", "warn", "error", "debug", "trace"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    const ok = fakeClient(toolResponse(VALID_INPUT));
    await extractWithClaude({ text: SECRET }, { client: ok.client });
    const fail = fakeClient(new Error(SECRET));
    await extractWithClaude({ text: SECRET }, { client: fail.client }).catch(() => {});
    const bad = fakeClient({ content: [], stop_reason: "end_turn" });
    await extractWithClaude({ text: SECRET }, { client: bad.client }).catch(() => {});
    for (const s of spies) expect(s).not.toHaveBeenCalled();
  });
});
