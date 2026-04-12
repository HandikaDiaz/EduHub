import { UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="md:hidden text-lg font-bold text-brand-sky">EduHub</div>
      <div className="flex-1" />
      <UserButton />
    </header>
  );
}
