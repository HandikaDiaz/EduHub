import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("svix", () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn().mockImplementation((body: string) => JSON.parse(body)),
  })),
}));

vi.mock("convex/nextjs", () => ({
  fetchMutation: vi.fn().mockResolvedValue("mock-convex-id"),
}));

// Next.js 16: headers() is async
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string): string | null => {
      const map: Record<string, string> = {
        "svix-id": "test-svix-id",
        "svix-timestamp": "1234567890",
        "svix-signature": "v1,test-signature",
      };
      return map[key] ?? null;
    },
  }),
}));

import { POST } from "@/app/api/webhook/clerk/route";
import { fetchMutation } from "convex/nextjs";

function makeRequest(payload: unknown): Request {
  return new Request("http://localhost/api/webhook/clerk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/webhook/clerk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_WEBHOOK_SECRET = "whsec_test_secret";
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";
  });

  it("returns 500 when CLERK_WEBHOOK_SECRET is not set", async () => {
    delete process.env.CLERK_WEBHOOK_SECRET;
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(500);
  });

  it("returns 400 when svix headers are missing", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValueOnce({
      get: () => null,
    } as Awaited<ReturnType<typeof headers>>);
    const res = await POST(makeRequest({ type: "user.created" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when svix signature verification fails", async () => {
    const { Webhook } = await import("svix");
    vi.mocked(Webhook).mockImplementationOnce(
      () => ({ verify: vi.fn().mockImplementationOnce(() => { throw new Error("Invalid signature"); }) }) as unknown as InstanceType<typeof Webhook>,
    );
    const res = await POST(makeRequest({ type: "user.created" }));
    expect(res.status).toBe(400);
  });

  it("calls createUser mutation on user.created event", async () => {
    const payload = {
      type: "user.created",
      data: {
        id: "user_abc123",
        email_addresses: [{ email_address: "john@example.com" }],
        first_name: "John",
        last_name: "Doe",
      },
    };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(fetchMutation).toHaveBeenCalledWith(expect.anything(), {
      clerkId: "user_abc123",
      email: "john@example.com",
      name: "John Doe",
    });
  });

  it("falls back to email as name when first_name and last_name are empty", async () => {
    const payload = {
      type: "user.created",
      data: {
        id: "user_xyz",
        email_addresses: [{ email_address: "noname@example.com" }],
        first_name: null,
        last_name: null,
      },
    };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(fetchMutation).toHaveBeenCalledWith(expect.anything(), {
      clerkId: "user_xyz",
      email: "noname@example.com",
      name: "noname@example.com",
    });
  });

  it("calls updateUser mutation on user.updated event", async () => {
    const payload = {
      type: "user.updated",
      data: {
        id: "user_abc123",
        email_addresses: [{ email_address: "updated@example.com" }],
        first_name: "Jane",
        last_name: "Smith",
      },
    };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(fetchMutation).toHaveBeenCalledWith(expect.anything(), {
      clerkId: "user_abc123",
      email: "updated@example.com",
      name: "Jane Smith",
    });
  });

  it("calls softDeleteUser mutation on user.deleted event", async () => {
    const payload = {
      type: "user.deleted",
      data: { id: "user_abc123" },
    };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(fetchMutation).toHaveBeenCalledWith(expect.anything(), {
      clerkId: "user_abc123",
    });
  });

  it("returns 200 for unhandled event types without calling fetchMutation", async () => {
    const payload = { type: "session.created", data: { id: "sess_xyz" } };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(fetchMutation).not.toHaveBeenCalled();
  });
});
