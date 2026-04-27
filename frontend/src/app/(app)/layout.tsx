"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Navbar from "@/components/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    // Wait until Zustand has read localStorage; otherwise a freshly-loaded
    // logged-in user briefly sees `token === null` and gets bounced to /login.
    if (hasHydrated && !token) router.replace("/login");
  }, [hasHydrated, token, router]);

  // Show nothing while hydrating, and nothing once we've decided to redirect.
  if (!hasHydrated || !token) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
