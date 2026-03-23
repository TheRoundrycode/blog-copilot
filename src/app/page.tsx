"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isOnboardingComplete } from "@/lib/store";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isOnboardingComplete()) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="animate-pulse text-on-surface-variant">로딩 중...</div>
    </div>
  );
}
