"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsStore } from "@/stores/settings-store";
import { useValidateApiKey } from "@/hooks/use-octav";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

export function ApiKeyForm() {
  const { octavApiKey, setOctavApiKey } = useSettingsStore();
  const [key, setKey] = useState(octavApiKey);
  const validate = useValidateApiKey();

  const handleSave = () => {
    validate.mutate(key.trim(), {
      onSuccess: () => {
        setOctavApiKey(key.trim());
        toast.success("API key updated");
      },
      onError: () => {
        toast.error("Invalid API key");
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Octav API Key</CardTitle>
        <CardDescription>Your API key for accessing Octav services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>API Key</Label>
          <Input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        <Button onClick={handleSave} disabled={validate.isPending}>
          {validate.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
