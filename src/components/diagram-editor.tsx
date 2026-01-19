"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

interface DiagramEditorProps {
  onSave: (imageData: Blob) => void;
}

export function DiagramEditor({ onSave }: DiagramEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleSave = () => {
    // Send message to Draw.io iframe to export diagram as PNG
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          action: "export",
          format: "png",
          spinKey: "saving",
        }),
        "*"
      );
    }
  };

  // Listen for messages from Draw.io
  const handleMessage = (event: MessageEvent) => {
    if (event.data && typeof event.data === "string") {
      try {
        const msg = JSON.parse(event.data);

        if (msg.event === "export") {
          // Convert base64 to blob
          const byteCharacters = atob(msg.data.split(",")[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "image/png" });

          onSave(blob);
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Error processing Draw.io message:", error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Create Diagram
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Create Diagram</DialogTitle>
          <DialogDescription>
            Use Draw.io to create technical diagrams and sketches
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 relative">
          <iframe
            ref={iframeRef}
            src="https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json"
            className="w-full h-[calc(80vh-150px)] border rounded"
            onLoad={() => {
              window.addEventListener("message", handleMessage);
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Diagram</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
