import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaInstaller } from "@/components/pwa-installer";

export const metadata: Metadata = {
  title: "Application Contacts",
  description: "Centralisation et gestion de contacts (Wix, Mailchimp, Excel...) avec détection de doublons",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Contacts",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <a href="/" className="flex items-center gap-2 font-semibold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-sm">
                  C
                </span>
                Application Contacts
              </a>
              <nav className="flex items-center gap-1 text-sm">
                <a href="/" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                  Contacts
                </a>
                <a href="/import" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                  Importer
                </a>
                <a href="/doublons" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                  Doublons
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
          <PwaInstaller />
        </div>
      </body>
    </html>
  );
}
