import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FavoritesProvider } from "@/components/tv/FavoritesProvider";
import { siteConfig } from "@/lib/config";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: `${siteConfig.name} — A little closer to home`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: { icon: "/icon.svg" },
  openGraph: { title: siteConfig.name, description: siteConfig.description, type: "website" },
};
export const viewport: Viewport = { themeColor: "#0b0c10", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><FavoritesProvider><a href="#main-content" className="skip-link">Skip to content</a><Header /><main id="main-content">{children}</main><Footer /></FavoritesProvider><Analytics /></body></html>;
}
