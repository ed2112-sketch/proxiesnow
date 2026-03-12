import { describe, it, expect, vi } from "vitest";

vi.mock("./db", () => ({ prisma: {} }));

import { generateCredentials } from "./proxy-service";

describe("generateCredentials", () => {
  it("returns username and password strings", () => {
    const creds = generateCredentials();
    expect(creds.username).toBeDefined();
    expect(creds.password).toBeDefined();
    expect(creds.username.length).toBeGreaterThanOrEqual(8);
    expect(creds.password.length).toBeGreaterThanOrEqual(12);
  });

  it("generates unique credentials each call", () => {
    const a = generateCredentials();
    const b = generateCredentials();
    expect(a.username).not.toBe(b.username);
    expect(a.password).not.toBe(b.password);
  });
});
