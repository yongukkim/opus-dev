"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SearchIndex } from "@/lib/searchIndex.types";
import { SEARCH_INDEX_PATH } from "@/lib/searchIndex.types";

/**
 * Omni-search context (PR-8 of the home redesign series, spec §4.1 /
 * §4.3). Owns:
 *   - open/close state + the global key bindings (⌘K mac, Ctrl+K
 *     win/linux, `/` outside any input);
 *   - the lazy fetch + in-memory cache of /api/search/index.json so the
 *     index is paid for only when the user actually opens the modal.
 *
 * Why client-only: the bindings + state are inherently interactive, and
 * the modal renders inside this provider's tree.
 */

type LoadStatus = "idle" | "loading" | "ready" | "error";

type Ctx = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  index: SearchIndex | null;
  loadStatus: LoadStatus;
  /** Trigger a fetch (idempotent). Modal call this on first open. */
  ensureLoaded: () => void;
};

const OmniSearchContext = createContext<Ctx | null>(null);

export function useOmniSearch(): Ctx {
  const ctx = useContext(OmniSearchContext);
  if (!ctx) throw new Error("useOmniSearch must be used inside OmniSearchProvider");
  return ctx;
}

/**
 * Returns true when the keyboard event originated from somewhere a typing
 * user expects raw character input. We use this to decide whether `/`
 * should open the search modal — spec §4.1 only enables it OUTSIDE of
 * input/textarea/contenteditable (so collectors can still type `/` into
 * a description field).
 */
function isTypingContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function OmniSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  // Guard against double-fire when the modal mounts and immediately
  // requests the index in the same tick.
  const inFlightRef = useRef<Promise<void> | null>(null);

  const ensureLoaded = useCallback(() => {
    if (loadStatus === "ready" || loadStatus === "loading") return;
    if (inFlightRef.current) return;
    setLoadStatus("loading");
    inFlightRef.current = (async () => {
      try {
        const res = await fetch(SEARCH_INDEX_PATH, { cache: "force-cache" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as SearchIndex;
        setIndex(json);
        setLoadStatus("ready");
      } catch (err) {
        console.error("[omnisearch] index fetch failed", err);
        setLoadStatus("error");
      } finally {
        inFlightRef.current = null;
      }
    })();
  }, [loadStatus]);

  const open = useCallback(() => {
    setIsOpen(true);
    ensureLoaded();
  }, [ensureLoaded]);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) ensureLoaded();
      return !prev;
    });
  }, [ensureLoaded]);

  // Global key bindings (spec §4.1).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key;
      // ⌘K (mac) / Ctrl+K (win/linux) — works anywhere, including inputs.
      if ((event.metaKey || event.ctrlKey) && (key === "k" || key === "K")) {
        event.preventDefault();
        toggle();
        return;
      }
      // ESC closes (cmdk also handles ESC inside the modal, but we cover the
      // edge case where focus escapes the modal).
      if (key === "Escape" && isOpen) {
        event.preventDefault();
        close();
        return;
      }
      // `/` opens search ONLY outside typing contexts so collectors and
      // artists can still type slashes into description / note fields.
      if (key === "/" && !isOpen && !isTypingContext(event.target)) {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, isOpen, open, toggle]);

  const value = useMemo<Ctx>(
    () => ({ isOpen, open, close, toggle, index, loadStatus, ensureLoaded }),
    [isOpen, open, close, toggle, index, loadStatus, ensureLoaded],
  );

  return (
    <OmniSearchContext.Provider value={value}>{children}</OmniSearchContext.Provider>
  );
}
