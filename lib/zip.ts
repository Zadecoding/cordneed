import JSZip from 'jszip';

export async function createProjectZip(
  projectName: string,
  files: Record<string, string>
): Promise<Buffer> {
  const zip = new JSZip();
  const folder = zip.folder(projectName) || zip;

  Object.entries(files).forEach(([filePath, content]) => {
    folder.file(filePath, content);
  });

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return buffer;
}
