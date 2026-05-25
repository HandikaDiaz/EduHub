import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { AdminShell } from "@/components/admin/AdminShell";
import { type ReactNode } from "react";
import type { Metadata } from "next";

// Admin area — strictly noindex.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await fetchQuery(api.users.getUserByClerkId, {
    clerkId: userId,
  });

  if (!user || user.role !== "admin" || user.isDeleted) {
    redirect("/dashboard");
  }

  return <AdminShell adminName={user.name}>{children}</AdminShell>;
}
