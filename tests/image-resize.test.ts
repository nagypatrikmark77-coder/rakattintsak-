import { describe, expect, it } from "vitest";
import { fitWithin, ImageDecodeError, MAX_IMAGE_SIDE } from "@/lib/image-resize";

describe("fitWithin", () => {
  it("a fekvő telefonfotó hosszabb oldala 1024 lesz, az arány marad", () => {
    expect(fitWithin(4032, 3024, 1024)).toEqual({ width: 1024, height: 768 });
  });

  it("az álló képernyőkép magassága lesz 1024", () => {
    expect(fitWithin(1080, 2400, 1024)).toEqual({ width: 461, height: 1024 });
    expect(fitWithin(3024, 4032, 1024)).toEqual({ width: 768, height: 1024 });
  });

  it("kisebb képet nem nagyít", () => {
    expect(fitWithin(800, 600, 1024)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1024, 500, 1024)).toEqual({ width: 1024, height: 500 });
  });

  it("négyzetes képnél mindkét oldal 1024", () => {
    expect(fitWithin(2048, 2048, 1024)).toEqual({ width: 1024, height: 1024 });
  });

  it("kerekít, és egyik oldal sem lesz 0", () => {
    expect(fitWithin(1500, 1001, 1024)).toEqual({ width: 1024, height: 683 });
    expect(fitWithin(10000, 3, 1024)).toEqual({ width: 1024, height: 1 });
  });

  it("érvénytelen méretre hibát dob", () => {
    expect(() => fitWithin(0, 100, 1024)).toThrow(RangeError);
    expect(() => fitWithin(100, -1, 1024)).toThrow(RangeError);
    expect(() => fitWithin(Number.NaN, 100, 1024)).toThrow(RangeError);
    expect(() => fitWithin(100, 100, 0)).toThrow(RangeError);
  });

  it("az alapértelmezett határ 1024 (DECISIONS.md)", () => {
    expect(MAX_IMAGE_SIDE).toBe(1024);
  });
});

describe("ImageDecodeError", () => {
  it("típusosan elkapható", () => {
    const err: unknown = new ImageDecodeError();
    expect(err).toBeInstanceOf(ImageDecodeError);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).name).toBe("ImageDecodeError");
  });
});
