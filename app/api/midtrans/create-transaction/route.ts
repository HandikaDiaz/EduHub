import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSnapTransaction, generateOrderId } from "@/lib/midtrans";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const CANONICAL_PRO_PRICE = 199000;

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized - Anda harus login terlebih dahulu" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, amount } = body;

    if (!plan || amount === undefined) {
      return NextResponse.json(
        { error: "plan dan amount adalah required" },
        { status: 400 }
      );
    }

    // Server-side amount validation — reject tampered requests
    if (plan === "pro" && amount !== CANONICAL_PRO_PRICE) {
      return NextResponse.json(
        { error: "Jumlah pembayaran tidak valid" },
        { status: 400 }
      );
    }

    // Get full user from Convex using Clerk ID (includes email)
    const user = await convex.query(api.users.getUserByClerkId, { clerkId });
    if (!user || user.isDeleted) {
      return NextResponse.json(
        { error: "User tidak ditemukan di database" },
        { status: 404 }
      );
    }

    const userId = user._id;

    // Generate unique order ID
    const orderId = generateOrderId(userId);

    // Build Snap transaction params
    const snapParams = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: user.name ?? "User",
        email: user.email,
      },
      item_details: [
        {
          id: plan === "pro" ? "eduhub-pro-1year" : "eduhub-free",
          price: amount,
          quantity: 1,
          name: plan === "pro" ? "EduHub Pro - 1 Tahun" : "EduHub Free",
          category: "Subscription",
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
      credit_card: {
        secure: true,
      },
    };

    // Create Snap transaction via Midtrans
    const { token, redirectUrl } = await createSnapTransaction(snapParams);

    // Save to Convex
    const result = await convex.mutation(api.transactions.createTransaction, {
      userId,
      amount,
      midtransOrderId: orderId,
      snapToken: token,
    });

    return NextResponse.json({
      snapToken: token,
      redirectUrl,
      transactionId: result.transactionId,
      orderId,
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    Sentry.captureException(error, {
      tags: { route: "midtrans/create-transaction" },
    });
    return NextResponse.json(
      { error: "Failed to create transaction. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
