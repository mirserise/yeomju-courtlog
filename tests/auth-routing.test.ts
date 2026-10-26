import { describe, expect, it } from "vitest";
import { isAuthCallbackHash } from "../src/utils";

describe("Identity callback routing", () => {
  it.each([
    "#recovery_token=token",
    "#invite_token=token",
    "#confirmation_token=token",
    "#email_change_token=token",
    "#access_token=token",
  ])("recognizes %s", (hash) => {
    expect(isAuthCallbackHash(hash)).toBe(true);
  });

  it("does not treat ordinary dashboard anchors as auth callbacks", () => {
    expect(isAuthCallbackHash("#calendar")).toBe(false);
  });
});
