import { describe, expect, it } from "vitest";
import { calculateFee } from "../netlify/lib/fees";

describe("calculateFee", () => {
  it("charges summer weekday daytime for 17:00", () => {
    expect(calculateFee("2026-06-15", "17:00")).toBe(10_000);
  });

  it("charges winter weekday mixed rate for 17:00", () => {
    expect(calculateFee("2026-10-27", "17:00")).toBe(12_500);
  });

  it("charges weekend nighttime rate", () => {
    expect(calculateFee("2026-10-31", "21:00")).toBe(20_000);
  });
});
