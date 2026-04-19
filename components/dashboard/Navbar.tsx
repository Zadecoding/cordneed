'use client';

import { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

interface DashboardNavbarProps {
  email?: string;
  fullName?: string;
  plan?: string;
}

export default function DashboardNavbar({ email, fullName, plan }: DashboardNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <header className="h-14 flex items-center px-4 gap-3 sticky top-0 z-30 glass border-b border-slate-800/60">
        {/* Hamburger — only shown on mobile (lg:hidden) */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div className="w-64 relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            className="input-glass w-full pl-9 pr-4 text-sm"
            style={{ paddingTop: 8, paddingBottom: 8 }}
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(14,22,56,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}>
            <Bell className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-none">{fullName || 'User'}</p>
              <p className="text-xs text-slate-500 leading-tight mt-0.5 truncate max-w-[140px]">{email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 flex-shrink-0">
            <div className="absolute top-3 right-3">
              <button onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar mobile onClose={() => setMobileOpen(false)} plan={plan} />
          </div>
        </div>
      )}
    </>
  );
}
