import { GuideClient } from "@/components/GuideClient";
import { buildMetadata } from "@/lib/seo-meta";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ pageKey: "guide", descriptionKey: "guide", path: "/guide", locale });
}

export default function GuidePage() {
  return <GuideClient />;
}