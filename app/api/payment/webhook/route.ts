import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ message: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const userId = payment.notes?.user_id;
      const plan = payment.notes?.plan;

      if (userId && plan === 'pro') {
        const supabase = await createAdminClient();

        // Update subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan: 'pro',
            status: 'active',
            razorpay_subscription_id: payment.id,
            current_period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Subscription update error:', error);
          return NextResponse.json({ message: 'DB error' }, { status: 500 });
        }

        // Update existing free-plan projects to remove watermark
        await supabase
          .from('projects')
          .update({ watermark: false })
          .eq('user_id', userId)
          .eq('watermark', true);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Webhook failed' }, { status: 500 });
  }
}
