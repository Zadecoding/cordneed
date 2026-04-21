'use client';

import { useState } from 'react';
import { Check, Crown, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  currentPlan: string;
  isLoggedIn: boolean;
}

const features = {
  free: [
    '2 projects per month',
    'Standard AI generation speed',
    'File tree & code viewer',
    'Copy code to clipboard',
    'React Native Expo output',
    'TypeScript by default',
    'Community support',
  ],
  pro: [
    'Unlimited projects',
    'Priority generation (3x faster)',
    'ZIP download export',
    'No watermark in code',
    'Premium app templates',
    'Advanced Expo Router setup',
    'Auth scaffolding included',
    'Navigation templates',
    'Priority email support',
    'Early access to new features',
  ],
};

const comparison = [
  { feature: 'Projects / month', free: '2', pro: 'Unlimited' },
  { feature: 'Generation speed', free: 'Standard', pro: '3x faster' },
  { feature: 'ZIP download', free: false, pro: true },
  { feature: 'Watermark', free: 'Yes', pro: 'None' },
  { feature: 'Premium templates', free: false, pro: true },
  { feature: 'Auth scaffolding', free: 'Basic', pro: 'Advanced' },
  { feature: 'File viewer', free: true, pro: true },
  { feature: 'Copy code', free: true, pro: true },
  { feature: 'TypeScript output', free: true, pro: true },
  { feature: 'Support', free: 'Community', pro: 'Priority email' },
];

export default function PricingPageClient({ currentPlan, isLoggedIn }: Props) {
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!isLoggedIn) { window.location.href = '/signup?plan=pro'; return; }
    setUpgrading(true);
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });
      if (!response.ok) throw new Error('Failed to create order');
      const order = await response.json();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open(): void } }).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount, currency: 'INR',
          name: 'Cordneed',
          description: 'Pro Plan — Monthly Subscription',
          order_id: order.id,
          handler: () => {
            toast.success('Payment successful! Upgraded to Pro 🎉');
            setTimeout(() => window.location.reload(), 1500);
          },
          prefill: { email: '' },
          theme: { color: '#6366f1' },
        });
        rzp.open();
      };
    } catch {
      toast.error('Payment initialization failed. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 mx-auto max-w-5xl w-full flex flex-col items-center justify-center">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Choose Your Plan
        </h1>
        <p className="text-slate-400">Start free, upgrade when you&apos;re ready to build more.</p>
      </div>

      {/* Pricing Cards - Fluid layout instead of strict columns to prevent overlap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '48px', width: '100%', maxWidth: '896px', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Free Plan */}
        <div className={`glass rounded-3xl p-7 border ${currentPlan === 'free' ? 'border-indigo-500/40' : 'border-slate-700'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
              <Zap className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <h2 className="font-bold text-white">Free</h2>
              {currentPlan === 'free' && <span className="text-xs text-indigo-400 font-medium">Current plan</span>}
            </div>
          </div>
          <div className="mb-5">
            <span className="text-3xl font-bold text-white">₹0</span>
            <span className="text-slate-400 text-sm">/forever</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {features.free.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{f}</span>
              </li>
            ))}
          </ul>
          <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-700 text-slate-500 cursor-default">
            {currentPlan === 'free' ? 'Current Plan' : 'Free Plan'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`glass rounded-3xl p-7 border relative overflow-hidden ${currentPlan === 'pro' ? 'border-emerald-500/40' : 'border-indigo-500/50 shadow-2xl'}`}
          style={currentPlan !== 'pro' ? { boxShadow: '0 25px 50px rgba(99,102,241,0.2)' } : {}}>
          {currentPlan !== 'pro' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="text-white text-xs font-bold px-4 py-1 rounded-full"
                style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}>
                Most Popular
              </span>
            </div>
          )}
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.05), transparent)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Pro</h2>
                {currentPlan === 'pro' && <span className="text-xs text-emerald-400 font-medium">✓ Active</span>}
              </div>
            </div>
            <div className="mb-5">
              <span className="text-3xl font-bold text-white">₹1499</span>
              <span className="text-slate-400 text-sm">/month</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {features.pro.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-200">{f}</span>
                </li>
              ))}
            </ul>

            {currentPlan === 'pro' ? (
              <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-default"
                style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                ✓ Pro Plan Active
              </button>
            ) : (
              <button onClick={handleUpgrade} disabled={upgrading}
                className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {upgrading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Pro
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="glass rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <h3 className="font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Full Feature Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Feature</th>
                <th className="text-center px-5 py-3 text-slate-400 font-medium">Free</th>
                <th className="text-center px-5 py-3 text-indigo-400 font-medium">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparison.map((row) => (
                <tr key={row.feature} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-slate-300">{row.feature}</td>
                  <td className="px-5 py-3 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? <Check className="w-4 h-4 text-slate-500 mx-auto" />
                        : <div className="w-4 h-0.5 bg-slate-700 mx-auto rounded" />
                    ) : <span className="text-slate-400 text-xs">{row.free}</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? <Check className="w-4 h-4 text-indigo-400 mx-auto" />
                        : <div className="w-4 h-0.5 bg-slate-700 mx-auto rounded" />
                    ) : <span className="text-indigo-300 text-xs font-medium">{row.pro}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-slate-600 mt-6">
        All prices in INR. Secure payments via Razorpay. Cancel anytime.
      </p>
    </div>
  );
}
