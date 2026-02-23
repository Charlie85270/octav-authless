"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepApiKey } from "@/components/onboarding/step-api-key";
import { StepWallets } from "@/components/onboarding/step-wallets";
import { StepAIKey } from "@/components/onboarding/step-ai-key";
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const steps = ["API Key", "Wallets", "AI (Optional)"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="flex flex-col items-center gap-2">
          <img src="/logo.png" alt="Octav" className="h-10 w-10" />
          <h1 className="text-2xl font-bold">Octav Authless</h1>
          <p className="text-sm text-muted-foreground">
            Step {step + 1} of {steps.length}: {steps[step]}
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
