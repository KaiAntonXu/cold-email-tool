import { Suspense } from "react";
import { ColdEmailGenerator } from "@/components/ColdEmailGenerator";
import { LogoutButton } from "@/components/LogoutButton";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_#1a2332_0%,_var(--background)_55%)]">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LogoutButton />
      </div>
      <Suspense>
        <ColdEmailGenerator />
      </Suspense>
    </main>
  );
}
