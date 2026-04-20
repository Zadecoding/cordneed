import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, FolderOpen, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

const statusConfig = {
  done:       { label: 'Done',       color: '#34d399', bgColor: 'rgba(52,211,153,0.1)',  icon: CheckCircle },
  generating: { label: 'Generating', color: '#fbbf24', bgColor: 'rgba(251,191,36,0.1)',  icon: Clock       },
  pending:    { label: 'Pending',     color: '#94a3b8', bgColor: 'rgba(148,163,184,0.1)', icon: Clock       },
  error:      { label: 'Error',       color: '#f87171', bgColor: 'rgba(248,113,113,0.1)', icon: AlertCircle },
} as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: projects }, { data: subscription }, { data: profile }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ]);

  const dbPlan = subscription?.plan || 'free';
  const plan = user.email === 'imsanju4141@gmail.com' ? 'pro' : dbPlan;
  const totalProjects = projects?.length || 0;

  // This month's projects
  const now = new Date();
  const thisMonthProjects = projects?.filter((p) => {
    const date = new Date(p.created_at);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length || 0;

  const monthLimit = plan === 'free' ? 2 : Infinity;

  return (
    <div className="p-6 lg:p-10 w-full" style={{ padding: '32px' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-1">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-slate-400 text-sm">Here&apos;s what&apos;s happening with your projects.</p>
      </div>

      {/* Stats - Fully fluid min/max grid that wraps safely without overlapping */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          {
            label: 'Total Projects',
            value: totalProjects,
            icon: FolderOpen,
            gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            shadow: 'rgba(99,102,241,0.35)',
          },
          {
            label: 'This Month',
            value: `${thisMonthProjects}/${plan === 'free' ? 2 : '∞'}`,
            icon: Clock,
            gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            shadow: 'rgba(6,182,212,0.35)',
          },
          {
            label: 'Your Plan',
            value: plan === 'pro' ? 'Pro ✨' : 'Free',
            icon: Zap,
            gradient: plan === 'pro' ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'linear-gradient(135deg, #475569, #64748b)',
            shadow: plan === 'pro' ? 'rgba(245,158,11,0.35)' : 'rgba(71,85,105,0.2)',
          },
          {
            label: 'Done Apps',
            value: projects?.filter((p) => p.status === 'done').length || 0,
            icon: CheckCircle,
            gradient: 'linear-gradient(135deg, #10b981, #14b8a6)',
            shadow: 'rgba(16,185,129,0.35)',
          },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-5 border border-slate-700 hover:border-indigo-500/40 transition-all flex flex-col justify-between min-h-[140px]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-lg"
              style={{ background: stat.gradient, boxShadow: `0 4px 12px ${stat.shadow}` }}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Usage progress (free plan) */}
      {plan === 'free' && (
        <div className="glass rounded-2xl p-5 border border-indigo-500/20 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">Monthly Usage</p>
              <p className="text-xs text-slate-400">{thisMonthProjects} of 2 free projects used</p>
            </div>
            <Link href="/pricing">
              <button className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold">
                <span className="relative z-10">Upgrade to Pro</span>
              </button>
            </Link>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${Math.min((thisMonthProjects / 2) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Link href="/create">
          <button className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm">
            <span className="relative z-10 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Create New App
            </span>
          </button>
        </Link>
        <Link href="/projects">
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm glass border border-slate-700 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all">
            <FolderOpen className="w-4 h-4" />
            View All Projects
          </button>
        </Link>
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)] mb-4">
          Recent Projects
        </h2>

        {!projects?.length ? (
          <div className="glass rounded-2xl border border-slate-800 border-dashed p-12 flex flex-col items-center justify-center text-center">
            <FolderOpen className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-500 font-medium mb-1">No projects yet</p>
            <p className="text-slate-600 text-sm mb-4">Start by describing the app you want to build</p>
            <Link href="/create">
              <button className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm">
                <span className="relative z-10 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Build Your First App
                </span>
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {projects.map((project) => {
              const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.pending;
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="glass glass-hover rounded-2xl p-5 border border-slate-700 cursor-pointer h-full">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <FolderOpen className="w-4 h-4 text-white" />
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                        style={{ color: status.color, background: status.bgColor }}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{project.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.prompt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{formatDate(project.created_at)}</span>
                      {project.files && (
                        <span>{Object.keys(project.files).length} files</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
