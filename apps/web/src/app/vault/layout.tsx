import type { ReactNode } from "react";
import { VaultSidebar } from "@/components/vault/VaultSidebar";

/**
 * Vault shell: sidebar + main (pattern: Web_Template mini_finance).
 * Sticky site header + trust strip sit above; offset matches 6.5rem stack.
 */
export default function VaultLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[50vh] flex-col bg-opus-charcoal pt-[6.5rem] md:min-h-[calc(100dvh-12rem)] md:flex-row">
      <VaultSidebar />
      <div className="flex min-w-0 flex-1 flex-col border-t border-white/[0.05] md:border-l md:border-t-0">
        {children}
      </div>
    </div>
  );
}
