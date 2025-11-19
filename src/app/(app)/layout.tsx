import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/auth-actions";
import { AppHeader } from "@/components/habits/AppHeader";
import { BottomNav } from "@/components/habits/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto min-h-screen">
        <AppHeader />
        <div className="px-6 py-6 pb-24">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}


