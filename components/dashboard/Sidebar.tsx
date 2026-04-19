'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderOpen, PlusCircle, CreditCard, LogOut, Smartphone, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Create App', icon: PlusCircle, href: '/create', badge: 'NEW' },
  { label: 'My Projects', icon: FolderOpen, href: '/projects' },
  { label: 'Pricing', icon: CreditCard, href: '/pricing' },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
  plan?: string;
}

export default function Sidebar({ mobile, onClose, plan = 'free' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/');
    router.refresh();
  };

  return (
    <aside className="w-full h-full flex flex-col overflow-y-auto" style={{ background: '#060d1a' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'rgba(30,41,59,0.6)' }}>
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <span className="gradient-text font-bold text-[17px]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Cordneed
          </span>
        </Link>
        {mobile && onClose && (
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white bg-transparent border-none cursor-pointer text-lg">✕</button>
        )}
      </div>

      {/* Plan badge */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl"
          style={plan === 'pro'
            ? { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }
            : { background: 'rgba(30,40,70,0.5)', color: '#64748b', border: '1px solid rgba(30,41,59,0.5)' }}>
          <Zap className="w-3.5 h-3.5" style={{ fill: plan === 'pro' ? 'currentColor' : 'none' }} />
          {plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && (pathname ?? '').startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={`sidebar-item ${active ? 'active' : ''}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {item.badge && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      {plan === 'free' && (
        <div className="px-3 pb-3">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(14,22,56,0.8)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <Zap className="w-4 h-4 mb-2" style={{ color: '#818cf8' }} />
            <p className="text-xs font-semibold text-white mb-1">Upgrade to Pro</p>
            <p className="text-xs text-slate-500 mb-3">Unlimited apps, ZIP export, no watermark</p>
            <Link href="/pricing" className="no-underline">
              <button className="btn-primary w-full py-2 rounded-xl text-xs font-semibold">
                Upgrade — ₹499/mo
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4 pt-3 border-t" style={{ borderColor: 'rgba(30,41,59,0.6)' }}>
        <button onClick={handleLogout}
          className="sidebar-item w-full bg-transparent border-none"
          style={{ color: '#f87171' }}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
