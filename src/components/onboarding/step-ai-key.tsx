"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";
import type { AIProvider } from "@/types/ai";
import { ArrowLeft } from "lucide-react";

export function StepAIKey({
  onNext,
  onBack,
  onSkip,
}: {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const { aiProvider, aiApiKey, setAIProvider, setAIApiKey } = useSettingsStore();
  const [provider, setProvider] = useState<AIProvider>(aiProvider);
  const [key, setKey] = useState(aiApiKey);

  const handleSave = () => {
    setAIProvider(provider);
    setAIApiKey(key.trim());
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Chat (Optional)</CardTitle>
        <CardDescription>
          Add an API key to chat about your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as AIProvider)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>API Key</Label>
          <Input
            type="password"
            placeholder={`Enter your ${provider === "openai" ? "OpenAI" : "Anthropic"} API key`}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="ghost" onClick={onSkip} className="flex-1">
            Skip
          </Button>
          <Button onClick={handleSave} disabled={!key.trim()} className="flex-1">
            Save & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
