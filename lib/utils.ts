import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getFileLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    json: 'json',
    md: 'markdown',
    css: 'css',
    html: 'html',
    sh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
  };
  return map[ext || ''] || 'plaintext';
}

export function buildFileTree(files: Record<string, string>) {
  type Node = {
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: Node[];
    content?: string;
  };

  const root: Node[] = [];

  Object.entries(files).forEach(([path, content]) => {
    const parts = path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const existing = current.find((n) => n.name === part);

      if (isLast) {
        if (!existing) {
          current.push({ name: part, type: 'file', path, content });
        }
      } else {
        if (!existing) {
          const folder: Node = {
            name: part,
            type: 'folder',
            path: parts.slice(0, index + 1).join('/'),
            children: [],
          };
          current.push(folder);
          current = folder.children!;
        } else {
          current = existing.children!;
        }
      }
    });
  });

  return root;
}
