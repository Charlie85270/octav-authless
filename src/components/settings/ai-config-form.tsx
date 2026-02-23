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
import { toast } from "sonner";
import { Check } from "lucide-react";

export function AIConfigForm() {
  const { aiProvider, aiApiKey, setAIProvider, setAIApiKey } = useSettingsStore();
  const [provider, setProvider] = useState<AIProvider>(aiProvider);
  const [key, setKey] = useState(aiApiKey);

  const handleSave = () => {
    setAIProvider(provider);
    setAIApiKey(key.trim());
    toast.success("AI configuration updated");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Chat Configuration</CardTitle>
        <CardDescription>Configure your AI provider for the chat feature</CardDescription>
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
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={`${provider === "openai" ? "sk-..." : "sk-ant-..."}`}
          />
        </div>
        <Button onClick={handleSave}>
          <Check className="mr-2 h-4 w-4" />
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
