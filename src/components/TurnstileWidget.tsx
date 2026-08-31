"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turntstileLoaded?: boolean;
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          language?: string;
        },
      ) => string;
      reset: (id: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  theme?: "light" | "dark" | "auto";
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "turnstile-script";
const LANG_MAP: Record<string, string> = { uk: "uk", ru: "ru", en: "en" };

export function TurnstileWidget({ siteKey, onToken, theme = "light" }: TurnstileWidgetProps) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let disposed = false;

    function safeCallback(cb: () => void) {
      if (!disposed) cb();
    }

    function render() {
      if (!window.turnstile || !el || disposed) return;
      const language = LANG_MAP[locale] || "en";
      window.turnstile.render(el, {
        sitekey: siteKey,
        theme,
        language,
        callback: (token) => safeCallback(() => onTokenRef.current(token)),
        "expired-callback": () => safeCallback(() => onTokenRef.current(null)),
        "error-callback": () => safeCallback(() => onTokenRef.current(null)),
      });
    }

    function onLoad() {
      if (!disposed) render();
    }

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = onLoad;
      document.body.appendChild(script);
    } else if (window.turnstile) {
      render();
    } else {
      window.addEventListener("turnstile-loaded", onLoad, { once: true });
    }

    return () => {
      disposed = true;
    };
  }, [siteKey, theme, locale]);

  return <div ref={containerRef} data-turnstile-widget />;
}
