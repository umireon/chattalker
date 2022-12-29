import { coarseIntoString, coarseIntoUint8Array } from "./coarse";
import { describe, expect, it } from "vitest";

describe.concurrent("coarseIntoUint8Array", () => {
  it("converts string into Uint8Array", () => {
    const str = "A";
    const actual = coarseIntoUint8Array(str);
    expect(actual).toEqual(new Uint8Array([65]));
  });

  it("does nothing with Uint8Array", () => {
    const array = new Uint8Array([0, 1, 2]);
    const actual = coarseIntoUint8Array(array);
    expect(actual).toBe(array);
  });
});

describe.concurrent("coarseIntoString", () => {
  it("converts Uint8Array into string", () => {
    const array = new Uint8Array([65]);
    const actual = coarseIntoString(array);
    expect(actual).toBe("A");
  });

  it("does nothing with string", () => {
    const str = "string";
    const actual = coarseIntoString(str);
    expect(actual).toBe(str);
  });
});
