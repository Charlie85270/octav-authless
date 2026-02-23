"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettingsStore } from "@/stores/settings-store";

export function useRequireSetup() {
  const router = useRouter();
  const isConfigured = useSettingsStore((s) => s.isConfigured);

  useEffect(() => {
    if (!isConfigured()) {
      router.replace("/onboarding");
    }
  }, [isConfigured, router]);
}
