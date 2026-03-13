"use client";

import { useState, useRef, useCallback } from "react";

interface StreamState {
  domains: string[];
  isStreaming: boolean;
  ready: boolean; // true once we have enough domains buffered to show
  error: string | null;
}

const BUFFER_THRESHOLD = 3; // Show UI once we have this many domains

async function consumeSSE(
  res: Response,
  onDomain: (domain: string) => void,
  onError: (error: string) => void,
  onDone: () => void
) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop()!;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);

        if (payload === "[DONE]") {
          onDone();
          return;
        }

        try {
          const data = JSON.parse(payload);
          if (data.domain) onDomain(data.domain);
          if (data.error) {
            onError(data.error);
            return;
          }
        } catch {
          // skip
        }
      }
    }
    onDone();
  } catch (e) {
    if ((e as Error).name !== "AbortError") {
      onError("Stream interrupted");
    }
  }
}

export function useStreamingDomains() {
  const [state, setState] = useState<StreamState>({
    domains: [],
    isStreaming: false,
    ready: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const seenRef = useRef(new Set<string>());

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  const startStream = useCallback(
    async (topic: string, mode: "discover" | "for-you") => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      seenRef.current = new Set();

      setState({ domains: [], isStreaming: true, ready: false, error: null });

      try {
        const res = await fetch("/api/domains/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, mode }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setState((s) => ({ ...s, isStreaming: false, error: "Failed to connect" }));
          return;
        }

        await consumeSSE(
          res,
          (domain) => {
            if (seenRef.current.has(domain)) return;
            seenRef.current.add(domain);
            setState((s) => {
              const newDomains = [...s.domains, domain];
              return {
                ...s,
                domains: newDomains,
                ready: newDomains.length >= BUFFER_THRESHOLD,
              };
            });
          },
          (error) => setState((s) => ({ ...s, isStreaming: false, error })),
          () => setState((s) => ({ ...s, isStreaming: false, ready: s.domains.length > 0 }))
        );
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setState((s) => ({ ...s, isStreaming: false, error: "Stream interrupted" }));
        }
      }
    },
    []
  );

  const appendMore = useCallback(
    async (topic: string, mode: "discover" | "for-you") => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((s) => ({ ...s, isStreaming: true, error: null }));

      try {
        const res = await fetch("/api/domains/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, mode }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setState((s) => ({ ...s, isStreaming: false }));
          return;
        }

        await consumeSSE(
          res,
          (domain) => {
            if (seenRef.current.has(domain)) return;
            seenRef.current.add(domain);
            setState((s) => ({ ...s, domains: [...s.domains, domain] }));
          },
          () => setState((s) => ({ ...s, isStreaming: false })),
          () => setState((s) => ({ ...s, isStreaming: false }))
        );
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setState((s) => ({ ...s, isStreaming: false }));
        }
      }
    },
    []
  );

  return { ...state, startStream, stopStream, appendMore };
}
