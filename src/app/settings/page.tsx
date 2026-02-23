"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { WalletManager } from "@/components/settings/wallet-manager";
import { AIConfigForm } from "@/components/settings/ai-config-form";
import { useRequireSetup } from "@/hooks/use-require-setup";

export default function SettingsPage() {
  useRequireSetup();

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Settings</h1>
        <ApiKeyForm />
        <WalletManager />
        <AIConfigForm />
      </div>
    </AppShell>
  );
}
