"use client";

import { createQueryClient } from "@opus/api";
import { ViewportContentFriction } from "@/components/layout/ViewportContentFriction";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";

/** Poll session so UI matches server after JWT expiry (~1 min after maxAge). */
const SESSION_REFETCH_INTERVAL_SEC = 60;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <SessionProvider refetchInterval={SESSION_REFETCH_INTERVAL_SEC}>
      <QueryClientProvider client={queryClient}>
        <ViewportContentFriction />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
