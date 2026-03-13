"use client";

import { useState, useRef, useCallback } from "react";

interface StreamState {
  domains: string[];
  isStreaming: boolean;
  error: string | null;
}

export function useStreamingDomains() {
  const [state, setState] = useState<StreamState>({
    domains: [],
    isStreaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  const startStream = useCallback(
    async (topic: string, mode: "discover" | "for-you") => {
      // Abort any existing stream
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setState({ domains: [], isStreaming: true, error: null });

      try {
        const res = await fetch("/api/domains/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, mode }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setState((s) => ({
            ...s,
            isStreaming: false,
            error: "Failed to connect",
          }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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
              setState((s) => ({ ...s, isStreaming: false }));
              return;
            }

            try {
              const data = JSON.parse(payload);
              if (data.domain) {
                setState((s) => ({
                  ...s,
                  domains: [...s.domains, data.domain],
                }));
              }
              if (data.error === "no-likes") {
                setState((s) => ({
                  ...s,
                  isStreaming: false,
                  error: "no-likes",
                }));
                return;
              }
              if (data.error) {
                setState((s) => ({
                  ...s,
                  isStreaming: false,
                  error: data.error,
                }));
                return;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        setState((s) => ({ ...s, isStreaming: false }));
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setState((s) => ({
            ...s,
            isStreaming: false,
            error: "Stream interrupted",
          }));
        }
      }
    },
    []
  );

  const appendMore = useCallback(
    async (topic: string, mode: "discover" | "for-you") => {
      // Don't reset domains, just append
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

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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
              setState((s) => ({ ...s, isStreaming: false }));
              return;
            }

            try {
              const data = JSON.parse(payload);
              if (data.domain) {
                setState((s) => {
                  if (s.domains.includes(data.domain)) return s;
                  return { ...s, domains: [...s.domains, data.domain] };
                });
              }
            } catch {
              // Skip
            }
          }
        }
        setState((s) => ({ ...s, isStreaming: false }));
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setState((s) => ({ ...s, isStreaming: false }));
        }
      }
    },
    []
  );

  return {
    ...state,
    startStream,
    stopStream,
    appendMore,
  };
}
