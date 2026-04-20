import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ProjectDetailClient from './ProjectDetailClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('projects').select('name').eq('id', id).single();
  return { title: data?.name || 'Project' };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: project }, { data: subscription }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
  ]);

  if (!project) notFound();

  const isPro = subscription?.plan === 'pro' || user.email === 'imsanju4141@gmail.com';
  const files = (project.files as Record<string, string>) || {};

  return (
    <ProjectDetailClient project={project} files={files} isPro={isPro} />
  );
}
