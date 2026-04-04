"use client";

import { createQueryClient } from "@opus/api";
import { ViewportContentFriction } from "@/components/layout/ViewportContentFriction";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ViewportContentFriction />
      {children}
    </QueryClientProvider>
  );
}
