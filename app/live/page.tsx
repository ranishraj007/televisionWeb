import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { ChannelGrid } from "@/components/tv/ChannelGrid";
import { categories } from "@/lib/channels";
export const metadata: Metadata = { title: "Live TV" };
export default async function LivePage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" && categories.includes(params.category) ? params.category : "All channels";
  return <div className="shell page-content"><div className="page-heading"><div className="eyebrow"><Radio size={15} />ALWAYS SOMETHING TO WATCH</div><h1>Find your frequency<span>.</span></h1><p>News, big moments, and everyday favorites. Make yourself at home.</p></div><ChannelGrid key={`${query}-${category}`} initialQuery={query} initialCategory={category} /><p className="availability-note">Imported channel listings. Availability depends on the broadcaster; some sources may require provider access.</p></div>;
}
