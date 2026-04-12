import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { type ReactNode } from "react";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/materi", label: "Materi" },
  { href: "/admin/quiz", label: "Quiz" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/transaksi", label: "Transaksi" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await fetchQuery(api.users.getUserByClerkId, {
    clerkId: userId,
  });

  if (!user || user.role !== "admin" || user.isDeleted) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
          <span className="text-white font-bold text-xl">EduHub Admin</span>
        </div>
        <nav aria-label="Admin navigation" className="flex-1 p-4 space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-950 text-white p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
