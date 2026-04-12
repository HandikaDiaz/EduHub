import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();
  const name =
    user?.firstName ??
    user?.emailAddresses[0]?.emailAddress ??
    "there";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Selamat datang, {name}!
      </h1>
      <p className="mt-2 text-gray-500">
        Mulai belajar dengan memilih materi di sidebar.
      </p>
    </div>
  );
}
