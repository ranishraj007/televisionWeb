import type { Metadata } from "next";
import { Guide } from "@/components/tv/Guide";
export const metadata: Metadata = { title: "Channel guide" };
export default function GuidePage() {
  return <div className="shell page-content"><Guide full /><p className="availability-note">All times above are illustrative, in Nepal time (UTC+05:45). A verified EPG has not been connected. Channel links open the live stream, not the sample programme.</p></div>;
}
