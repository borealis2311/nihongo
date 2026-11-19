import type { Metadata } from "next";
import { ProfileClient } from "@/components/pages/profile-client";
import { getLibrary } from "@/lib/strapi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hồ sơ" };

export default async function ProfilePage() {
  const library = await getLibrary();
  return <ProfileClient library={library} />;
}
