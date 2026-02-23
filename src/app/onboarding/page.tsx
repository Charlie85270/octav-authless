"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepApiKey } from "@/components/onboarding/step-api-key";
import { StepWallets } from "@/components/onboarding/step-wallets";
import { StepAIKey } from "@/components/onboarding/step-ai-key";
import { Shield } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const steps = ["API Key", "Wallets", "AI (Optional)"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="Octav" className="h-12 w-auto" />
          <h1 className="text-2xl font-bold">Octav Authless</h1>
          <p className="text-sm text-muted-foreground">
            Step {step + 1} of {steps.length}: {steps[step]}
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            <strong className="text-foreground">100% client-side.</strong> Your API keys and wallet addresses are stored in your browser&apos;s localStorage only. Nothing is ever sent to a server — all calls go directly to the Octav API from your browser.
          </p>
        </div>

        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 0 && <StepApiKey onNext={() => setStep(1)} />}
        {step === 1 && (
          <StepWallets onNext={() => setStep(2)} onBack={() => setStep(0)} />
        )}
        {step === 2 && (
          <StepAIKey
            onNext={() => router.replace("/dashboard")}
            onBack={() => setStep(1)}
            onSkip={() => router.replace("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
