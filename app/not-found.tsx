import Link from "next/link";
import { Radio, ArrowRight } from "lucide-react";
export default function NotFound() { return <div className="shell not-found"><Radio size={48} /><span className="eyebrow">404 · OFF AIR</span><h1>A little out of range.</h1><p>This page or channel isn’t in the lineup. There’s plenty more to discover.</p><Link className="button button-primary" href="/live">Back to live TV<ArrowRight size={18} /></Link></div>; }
