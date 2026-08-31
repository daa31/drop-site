"use client";

import { useEffect } from "react";
import { trackRecentSlug } from "@/lib/recently";

export function RecentlyTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackRecentSlug(slug);
  }, [slug]);
  return null;
}
