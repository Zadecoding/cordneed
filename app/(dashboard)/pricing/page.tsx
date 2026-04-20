import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PricingPageClient from './PricingPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Pricing' };

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let plan = 'free';
  if (user) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single();
    const dbPlan = subscription?.plan || 'free';
    plan = user.email === 'imsanju4141@gmail.com' ? 'pro' : dbPlan;
  }

  return <PricingPageClient currentPlan={plan} isLoggedIn={!!user} />;
}
