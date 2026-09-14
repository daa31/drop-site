"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ExpandableText({
  text,
  expandedByDefault = false,
  clampLines = 5,
  showMoreLabel = "Детальніше",
  collapseLabel = "Згорнути",
}: {
  text: string;
  expandedByDefault?: boolean;
  clampLines?: number;
  showMoreLabel?: string;
  collapseLabel?: string;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(!expandedByDefault);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 4);
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, [text]);

  return (
    <div className="relative">
      <div
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: clamped ? clampLines : "unset",
          overflow: "hidden",
        }}
      >
        {text}
      </div>
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          width: "100%",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: clampLines,
        }}
      >
        {text}
      </div>
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setClamped((value) => !value)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-sm font-semibold text-ink transition hover:border-black/30 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <ChevronDown size={16} strokeWidth={2.5} className={`shrink-0 transition-transform duration-300 ${clamped ? "rotate-0" : "rotate-180"}`} />
          {clamped ? showMoreLabel : collapseLabel}
        </button>
      )}
    </div>
  );
}