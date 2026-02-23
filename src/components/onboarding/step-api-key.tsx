"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsStore } from "@/stores/settings-store";
import { useValidateApiKey } from "@/hooks/use-octav";
import { Loader2 } from "lucide-react";

export function StepApiKey({ onNext }: { onNext: () => void }) {
  const [key, setKey] = useState(useSettingsStore.getState().octavApiKey);
  const setOctavApiKey = useSettingsStore((s) => s.setOctavApiKey);
  const validate = useValidateApiKey();

  const handleSubmit = async () => {
    if (!key.trim()) return;
    validate.mutate(key.trim(), {
      onSuccess: () => {
        setOctavApiKey(key.trim());
        onNext();
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Octav API Key</CardTitle>
        <CardDescription>
          Enter your API key from{" "}
          <a href="https://octav.fi" target="_blank" rel="noreferrer" className="underline">
            octav.fi
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your Octav API key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        {validate.isError && (
          <p className="text-sm text-destructive">
            Invalid API key. Please check and try again.
          </p>
        )}
        <Button onClick={handleSubmit} disabled={!key.trim() || validate.isPending} className="w-full">
          {validate.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
