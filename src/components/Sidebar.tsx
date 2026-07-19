'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Music4,
  Calculator,
  Activity,
  CalendarDays,
  Wallet,
  Settings,
  BookOpen,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/concerts', label: 'Concerts', icon: Music4 },
  { href: '/simulateur', label: 'Simulateur', icon: Calculator },
  { href: '/point-mort', label: 'Point mort', icon: Activity },
  { href: '/calendrier', label: 'Calendrier', icon: CalendarDays },
  { href: '/finances', label: 'Finances', icon: Wallet },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
  { href: '/documentation', label: 'Guide', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-brand-dark text-white flex flex-col">
      <div className="px-6 py-6 border-b border-white/10">
        <p className="text-lg font-semibold tracking-tight">Concert Manager</p>
        <p className="text-xs text-white/50">Pro</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10 text-xs text-white/40">
        Mundo Art Pour Tous
      </div>
    </aside>
  );
}
