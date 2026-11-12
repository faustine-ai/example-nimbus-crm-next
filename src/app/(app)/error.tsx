"use client"; // Error boundaries must be Client Components

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something went wrong"
      description="The page could not be loaded. Try again in a moment."
      action={<Button onClick={() => retry()}>Try again</Button>}
    />
  );
}
