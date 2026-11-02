"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { sessionKey } from "@/lib/demo-auth";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkedPath, setCheckedPath] = useState<string | null>(null);
  useEffect(() => {
    if (pathname === "/login") { setCheckedPath(null); return; }
    try {
      if (sessionStorage.getItem(sessionKey)) {
        setCheckedPath(pathname);
        return;
      }
    } catch { /* A browser with storage disabled must sign in again. */ }
    setCheckedPath(null);
    router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
  }, [pathname, router]);

  if (pathname === "/login") return <main id="main-content">{children}</main>;
  if (checkedPath !== pathname) return <main id="main-content" className="auth-loading" role="status">Opening gollTV…</main>;
  return <><a href="#main-content" className="skip-link">Skip to content</a><Header /><main id="main-content">{children}</main><Footer /></>;
}
