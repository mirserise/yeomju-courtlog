import { describe, expect, it } from "vitest";
import { cleanNoticeMessage, isValidNoticeDate } from "../netlify/lib/notices";

describe("calendar notices", () => {
  it("normalizes an optional notice prefix and whitespace", () => {
    expect(cleanNoticeMessage("  [공지]   시장배   단체전  ")).toBe("시장배 단체전");
  });

  it("accepts real ISO calendar dates only", () => {
    expect(isValidNoticeDate("2026-10-31")).toBe(true);
    expect(isValidNoticeDate("2026-02-30")).toBe(false);
    expect(isValidNoticeDate("10.31")).toBe(false);
  });
});
