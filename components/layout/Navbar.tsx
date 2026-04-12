import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      <Link href="/dashboard" className="md:hidden text-lg font-bold text-brand-sky">EduHub</Link>
      <div className="flex-1" />
      <UserButton />
    </header>
  );
}
