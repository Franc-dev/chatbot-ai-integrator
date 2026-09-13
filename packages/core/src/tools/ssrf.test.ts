import { describe, expect, it } from "vitest";
import { assertSafeUrl, isPrivateIp } from "./ssrf";

describe("ssrf guard", () => {
  it("flags private IPv4 ranges", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.0.0.8")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("8.8.8.8")).toBe(false);
  });

  it("rejects localhost hosts", async () => {
    await expect(assertSafeUrl("http://localhost/admin")).rejects.toThrow(/not allowed/);
    await expect(assertSafeUrl("http://127.0.0.1/")).rejects.toThrow(/private/);
  });

  it("rejects non-http schemes", async () => {
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toThrow(/http/);
  });
});
