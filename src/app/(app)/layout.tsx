import { AuthGate } from "@/components/auth-gate";
import { LogoutButton } from "@/components/logout-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
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
              <LogoutButton />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </div>
    </AuthGate>
  );
}
