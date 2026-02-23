"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "./chat-interface";
import { MessageSquare } from "lucide-react";

export function ChatPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full sm:w-[420px] flex-col p-0 sm:max-w-[420px]">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>Portfolio Assistant</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
