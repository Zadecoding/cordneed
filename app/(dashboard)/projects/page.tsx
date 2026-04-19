import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FolderOpen, PlusCircle, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Projects' };

const statusConfig = {
  done:       { label: 'Done',       color: '#34d399', bgColor: 'rgba(52,211,153,0.1)',  icon: CheckCircle },
  generating: { label: 'Generating', color: '#fbbf24', bgColor: 'rgba(251,191,36,0.1)',  icon: Loader2     },
  pending:    { label: 'Pending',     color: '#94a3b8', bgColor: 'rgba(148,163,184,0.1)', icon: Clock       },
  error:      { label: 'Failed',      color: '#f87171', bgColor: 'rgba(248,113,113,0.1)', icon: AlertCircle },
} as const;

const gradients = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #8b5cf6, #a855f7)',
];


export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 lg:p-10 mx-auto max-w-7xl w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-1">
            My Projects
          </h1>
          <p className="text-slate-400 text-sm">
            {projects?.length || 0} app{projects?.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <Link href="/create">
          <button className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm">
            <span className="relative z-10 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              New App
            </span>
          </button>
        </Link>
      </div>

      {!projects?.length ? (
        <div className="glass rounded-3xl border border-dashed border-slate-700 p-16 flex flex-col items-center justify-center text-center">
          <FolderOpen className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No projects yet</h3>
          <p className="text-slate-500 text-sm mb-6">
            Describe your app idea and let AI generate the complete React Native code
          </p>
          <Link href="/create">
            <button className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm">
              <span className="relative z-10 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Build Your First App
              </span>
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => {
            const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.pending;
            const gradient = gradients[i % gradients.length];
            const fileCount = project.files ? Object.keys(project.files).length : 0;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="glass glass-hover rounded-2xl border border-slate-700 overflow-hidden cursor-pointer group h-full">
                  {/* Gradient top stripe */}
                  <div className="h-1.5" style={{ background: gradient }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                        style={{ background: gradient }}>
                        <FolderOpen className="w-5 h-5 text-white" />
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                        style={{ color: status.color, background: status.bgColor }}>
                        <status.icon className={`w-3 h-3 ${project.status === 'generating' ? 'animate-spin' : ''}`} />
                        {status.label}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm mb-1.5 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                      {project.prompt}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{formatDate(project.created_at)}</span>
                      <div className="flex items-center gap-2">
                        {project.watermark && (
                          <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-700">
                            Watermark
                          </span>
                        )}
                        {fileCount > 0 && (
                          <span>{fileCount} files</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
