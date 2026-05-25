import crypto from "node:crypto";

// midtrans-client has no types; declare minimal shape we use.
type SnapClient = {
  createTransaction: (params: Record<string, unknown>) => Promise<{
    token: string;
    redirect_url: string;
  }>;
};

type MidtransClient = {
  Snap: new (opts: {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }) => SnapClient;
};

// Lazy-load the SDK so this module doesn't crash at build time if env is missing.
let _snap: SnapClient | null = null;

const getSnap = (): SnapClient => {
  if (_snap) return _snap;

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey || !clientKey) {
    throw new Error(
      "MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY must be set in environment variables",
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- midtrans-client is CommonJS
  const midtrans: MidtransClient = require("midtrans-client");
  _snap = new midtrans.Snap({ isProduction, serverKey, clientKey });
  return _snap;
};

export type SnapTransactionParams = {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
    category?: string;
  }>;
  callbacks?: {
    finish?: string;
  };
  credit_card?: {
    secure?: boolean;
  };
};

/**
 * Create a Midtrans Snap transaction and return token + redirect URL.
 * Call from a Next.js server route — never expose the server key client-side.
 */
export const createSnapTransaction = async (
  params: SnapTransactionParams,
): Promise<{ token: string; redirectUrl: string }> => {
  const snap = getSnap();
  const res = await snap.createTransaction(
    params as unknown as Record<string, unknown>,
  );
  return { token: res.token, redirectUrl: res.redirect_url };
};

/**
 * Verify a Midtrans webhook signature.
 * Midtrans computes `signature_key` as:
 *   SHA-512(order_id + status_code + gross_amount + server_key)
 *
 * Returns true iff the computed hash matches the one in the payload.
 */
export const verifyMidtransSignature = (payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;

  const expected = crypto
    .createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`,
    )
    .digest("hex");

  // timingSafeEqual requires equal-length buffers.
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(payload.signature_key, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

/**
 * Generate a unique order ID for Midtrans.
 * Format: EDU-{userId short}-{timestamp base36}-{random 4 chars}
 * Midtrans allows [a-zA-Z0-9\-_.,=] with max 50 chars.
 */
export const generateOrderId = (userId: string): string => {
  const shortUser = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-8);
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EDU-${shortUser}-${ts}-${rand}`;
};
