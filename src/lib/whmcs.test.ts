import { describe, it, expect, vi, beforeEach } from "vitest";
import { whmcsApi, validateLogin, getClientDetails, getClientProducts } from "./whmcs";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.stubEnv("WHMCS_API_URL", "https://billing.example.com/includes/api.php");
  vi.stubEnv("WHMCS_API_IDENTIFIER", "test-id");
  vi.stubEnv("WHMCS_API_SECRET", "test-secret");
  mockFetch.mockReset();
});

describe("whmcsApi", () => {
  it("sends correct params and returns parsed JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "success" }),
    });
    const result = await whmcsApi("TestAction", { foo: "bar" });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://billing.example.com/includes/api.php");
    expect(options.method).toBe("POST");
    const body = new URLSearchParams(options.body);
    expect(body.get("action")).toBe("TestAction");
    expect(body.get("identifier")).toBe("test-id");
    expect(body.get("secret")).toBe("test-secret");
    expect(body.get("responsetype")).toBe("json");
    expect(body.get("foo")).toBe("bar");
    expect(result).toEqual({ result: "success" });
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Server Error" });
    await expect(whmcsApi("TestAction", {})).rejects.toThrow("WHMCS API error: 500");
  });
});

describe("validateLogin", () => {
  it("returns client id on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "success", userid: 42 }),
    });
    const result = await validateLogin("user@example.com", "password123");
    expect(result).toEqual({ success: true, userId: 42 });
  });

  it("returns failure on invalid credentials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "error", message: "Invalid Credentials" }),
    });
    const result = await validateLogin("user@example.com", "wrong");
    expect(result).toEqual({ success: false, userId: null });
  });
});

describe("getClientDetails", () => {
  it("returns client details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: "success",
        client: { firstname: "John", lastname: "Doe", email: "john@example.com" },
      }),
    });
    const result = await getClientDetails(42);
    expect(result).toEqual({ firstname: "John", lastname: "Doe", email: "john@example.com" });
  });
});

describe("getClientProducts", () => {
  it("returns products array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: "success",
        products: { product: [{ id: 1, name: "Private Proxies", status: "Active" }] },
      }),
    });
    const result = await getClientProducts(42);
    expect(result).toEqual([{ id: 1, name: "Private Proxies", status: "Active" }]);
  });
});
