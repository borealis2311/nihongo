import { HomeClient } from "@/components/pages/home-client";
import { getLibrary } from "@/lib/strapi";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const library = await getLibrary();
  return <HomeClient library={library} />;
}
