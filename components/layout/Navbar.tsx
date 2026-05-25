import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { EduhubLogo } from "@/components/brand/EduhubLogo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      <Link
        href="/dashboard"
        className="md:hidden inline-flex items-center gap-2 text-lg font-bold text-brand-sky"
        aria-label="EduHub — ke dashboard"
      >
        <EduhubLogo variant="icon" size={28} />
        EduHub
      </Link>
      <div className="flex-1" />
      <UserButton />
    </header>
  );
}
