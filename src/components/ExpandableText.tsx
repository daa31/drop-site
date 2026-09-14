"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ExpandableText({
  text,
  expandedByDefault = false,
  clampLines = 5,
}: {
  text: string;
  expandedByDefault?: boolean;
  clampLines?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(!expandedByDefault);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 4);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div
        ref={ref}
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: clamped ? clampLines : "unset",
          overflow: "hidden",
        }}
      >
        {text}
      </div>
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setClamped((value) => !value)}
          className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:text-accentHover"
        >
          <ChevronDown size={16} className={`shrink-0 transition-transform duration-300 ${clamped ? "rotate-0" : "rotate-180"}`} />
        </button>
      )}
    </div>
  );
}