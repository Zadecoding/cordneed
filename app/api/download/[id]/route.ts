import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProjectZip } from '@/lib/zip';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription (Pro only)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    if (subscription?.plan !== 'pro') {
      return NextResponse.json(
        { message: 'ZIP download is a Pro feature. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Fetch project
    const { data: project } = await supabase
      .from('projects')
      .select('name, files')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!project || !project.files) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const files = project.files as Record<string, string>;
    const zipBuffer = await createProjectZip(
      project.name.toLowerCase().replace(/\s+/g, '-'),
      files
    );

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project.name.toLowerCase().replace(/\s+/g, '-')}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ message: 'Download failed' }, { status: 500 });
  }
}
