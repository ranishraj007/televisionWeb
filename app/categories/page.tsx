import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper, Clapperboard, Trophy, Film, Music2, Tv, Sparkles, Compass, Sun, ArrowUpRight, Grid2X2 } from "lucide-react";
import { categories, channels } from "@/lib/channels";
export const metadata: Metadata = { title: "Explore categories" };
const icons = [Newspaper, Clapperboard, Trophy, Film, Music2, Tv, Sparkles, Compass, Sun];
const descriptions = ["Stay close to the stories that matter.", "A little joy for your everyday.", "Every match. Every moment.", "Make tonight a movie night.", "Find the soundtrack to your day.", "A bit of everything you love.", "Big adventures for little viewers.", "Let your curiosity lead the way.", "A quieter moment in your day."];
export default function CategoriesPage() {
  return <div className="shell page-content"><div className="page-heading"><div className="eyebrow"><Grid2X2 size={15} />FOLLOW YOUR CURIOSITY</div><h1>What are you in the mood for<span>?</span></h1><p>A whole world of television. One place to explore.</p></div><div className="category-grid">{categories.slice(1).map((category, index) => { const Icon = icons[index]; return <Link href={`/live?category=${encodeURIComponent(category)}`} key={category} className={`category-tile art-${category.toLowerCase()}`}><div><Icon size={30} strokeWidth={1.5} /><ArrowUpRight size={21} /></div><h2>{category}</h2><p>{descriptions[index]}</p><span>{channels.filter(channel => channel.category === category).length} channels<ArrowUpRight size={14} /></span></Link>; })}</div></div>;
}
