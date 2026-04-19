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
    <div className="min-h-screen flex" style={{ background: '#040816' }}>
      {/* Sidebar — hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar plan={plan} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden w-full">
        <DashboardNavbar email={user.email} fullName={profile?.full_name} plan={plan} />
        <main className="flex-1 overflow-y-auto p-0 m-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
