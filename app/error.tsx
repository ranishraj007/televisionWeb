"use client";
import { RotateCcw } from "lucide-react";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <div className="shell empty-state"><h1>Let’s tune in again.</h1><p>Something interrupted this page. Give it another try.</p><button className="button button-primary" onClick={reset}><RotateCcw size={17} />Try again</button></div>; }
