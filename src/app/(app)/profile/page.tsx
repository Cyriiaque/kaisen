import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/auth-actions";
import { ProfileView } from "@/components/habits/ProfileView";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileView
      user={{
        email: user.email,
        name: user.name || "Utilisateur",
        avatar: user.avatar || undefined,
        theme: user.theme,
        notificationsEnabled: user.notificationsEnabled,
      }}
    />
  );
}

