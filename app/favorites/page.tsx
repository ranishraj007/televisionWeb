import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { ChannelGrid } from "@/components/tv/ChannelGrid";
export const metadata: Metadata = { title: "Your favorites" };
export default function FavoritesPage() {
  return <div className="shell page-content"><div className="page-heading"><div className="eyebrow"><Heart size={15} />YOUR PERSONAL LINEUP</div><h1>Keep the good ones<span>.</span></h1><p>Your favorite channels, right where you left them. Saved on this device.</p></div><ChannelGrid favoritesOnly /></div>;
}
