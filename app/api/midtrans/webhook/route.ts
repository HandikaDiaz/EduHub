import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyMidtransSignature } from "@/lib/midtrans";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify Midtrans signature
    const isValid = verifyMidtransSignature({
      order_id: body.order_id,
      status_code: body.status_code,
      gross_amount: body.gross_amount,
      signature_key: body.signature_key,
    });

    if (!isValid) {
      console.error("Invalid Midtrans signature for order:", body.order_id);
      Sentry.captureMessage("Invalid Midtrans signature", {
        level: "warning",
        tags: { route: "midtrans/webhook", reason: "invalid-signature" },
        extra: { orderId: body.order_id, statusCode: body.status_code },
      });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log("Midtrans webhook received for order:", body.order_id);
    console.log("Transaction status:", body.transaction_status);
    console.log("Status code:", body.status_code);

    // Map Midtrans status to our status
    const transactionStatus = body.transaction_status;
    const paymentStatus = body.status_code;

    let status: "success" | "failed" | "expired" | undefined;

    // Status mapping based on Midtrans documentation
    if (transactionStatus === "capture" && paymentStatus === "200") {
      // Credit card captured successfully
      status = "success";
    } else if (transactionStatus === "settlement") {
      // Payment settled (bank transfer, e-wallet, etc.)
      status = "success";
    } else if (transactionStatus === "cancel" || transactionStatus === "deny") {
      // Payment cancelled or denied
      status = "failed";
    } else if (transactionStatus === "expire") {
      // Payment expired (not paid within time limit)
      status = "expired";
    } else if (transactionStatus === "pending") {
      // Payment still pending - don't update status yet
      console.log("Transaction still pending, no status update");
      return NextResponse.json({ received: true });
    }

    if (!status) {
      console.log("Unhandled transaction status:", transactionStatus);
      return NextResponse.json({ received: true });
    }

    console.log(`Updating transaction ${body.order_id} status to: ${status}`);

    // Update transaction in Convex
    await convex.mutation(api.transactions.updateTransactionStatus, {
      midtransOrderId: body.order_id,
      status,
      paymentMethod: body.payment_type,
      paidAt: status === "success" ? Date.now() : undefined,
    });

    console.log(`Transaction ${body.order_id} updated successfully`);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    Sentry.captureException(error, {
      tags: { route: "midtrans/webhook" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
