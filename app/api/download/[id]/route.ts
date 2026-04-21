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

    // Fetch project (any plan can download)
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

    if (Object.keys(files).length === 0) {
      return NextResponse.json({ message: 'No files to download' }, { status: 400 });
    }

    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const zipBuffer = await createProjectZip(safeName, files);

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ message: 'Download failed' }, { status: 500 });
  }
}
