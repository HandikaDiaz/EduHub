import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import * as Sentry from "@sentry/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(req: Request): Promise<Response> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Next.js 16: headers() is async
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    // Sebelumnya silent fail — sekarang capture supaya tahu ada usaha forge
    // signature atau misconfigured webhook secret di Clerk dashboard.
    Sentry.captureException(err, {
      tags: { route: "webhook/clerk", reason: "invalid-signature" },
      extra: { svixId },
    });
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const { type, data } = evt;

  try {
    if (type === "user.created") {
      const { id, email_addresses, first_name, last_name } = data;
      const email = email_addresses[0]?.email_address ?? "";
      const name = [first_name, last_name].filter(Boolean).join(" ") || email;
      await fetchMutation(api.users.createUser, { clerkId: id, email, name });
    }

    if (type === "user.updated") {
      const { id, email_addresses, first_name, last_name } = data;
      const email = email_addresses[0]?.email_address ?? "";
      const name = [first_name, last_name].filter(Boolean).join(" ") || email;
      await fetchMutation(api.users.updateUser, { clerkId: id, email, name });
    }

    if (type === "user.deleted") {
      const { id } = data;
      if (id) {
        await fetchMutation(api.users.softDeleteUser, { clerkId: id });
      }
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "webhook/clerk", eventType: type },
    });
    return new Response("Sync error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
