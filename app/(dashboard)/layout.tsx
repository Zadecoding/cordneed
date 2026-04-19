import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardNavbar from '@/components/dashboard/Navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
  ]);
  const plan = subscription?.plan || 'free';

  return (
    <div className="min-h-screen w-full bg-[#040816] text-[#e2e8f0]" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
      {/* 
        On large screens, we force a strict 260px column for the Sidebar, 
        and the remaining space for the main content.
      */}
      <style suppressHydrationWarning>{`
        @media (min-width: 1024px) {
          .dashboard-grid { grid-template-columns: 260px minmax(0, 1fr) !important; }
        }
      `}</style>
      
      <div className="dashboard-grid min-h-screen w-full" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        {/* Sidebar — hidden on mobile, fixed 260px on lg+ */}
        <div className="hidden lg:block h-screen sticky top-0 overflow-y-auto border-r border-[#1e293b]" style={{ width: '260px' }}>
          <Sidebar plan={plan} />
        </div>

        {/* Main content wrapper */}
        <div className="flex flex-col min-w-0 h-screen overflow-hidden">
          <DashboardNavbar email={user.email} fullName={profile?.full_name} plan={plan} />
          
          <main className="flex-1 overflow-y-auto w-full relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
