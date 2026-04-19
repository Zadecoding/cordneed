'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FolderOpen, File, FileCode, FileJson, FileText } from 'lucide-react';
import { buildFileTree } from '@/lib/utils';

interface FileTreeProps {
  files: Record<string, string>;
  selectedFile: string | null;
  onSelect: (path: string) => void;
}

type TreeNode = {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: TreeNode[];
  content?: string;
};

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
    case 'js':
    case 'jsx':
      return FileCode;
    case 'json':
      return FileJson;
    case 'md':
      return FileText;
    default:
      return File;
  }
}

function getFileIconColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx': return 'text-blue-400';
    case 'ts': return 'text-blue-300';
    case 'js':
    case 'jsx': return 'text-yellow-400';
    case 'json': return 'text-amber-300';
    case 'md': return 'text-slate-400';
    case 'css': return 'text-pink-400';
    case 'gitignore': return 'text-slate-500';
    default: return 'text-slate-400';
  }
}

function TreeNodeView({
  node,
  depth = 0,
  selectedFile,
  onSelect,
}: {
  node: TreeNode;
  depth?: number;
  selectedFile: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0 || depth <= 1);
  const isSelected = selectedFile === node.path;
  const FileIcon = getFileIcon(node.name);
  const iconColor = getFileIconColor(node.name);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left group`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
          </motion.div>
          {open ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          )}
          <span className="text-xs text-slate-300 font-medium truncate">{node.name}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              {node.children?.map((child) => (
                <TreeNodeView
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  selectedFile={selectedFile}
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-left ${
        isSelected
          ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
      style={{ paddingLeft: `${depth * 14 + 8}px` }}
    >
      <FileIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-indigo-400' : iconColor}`} />
      <span className="text-xs font-mono truncate">{node.name}</span>
    </button>
  );
}

export default function FileTree({ files, selectedFile, onSelect }: FileTreeProps) {
  const tree = buildFileTree(files);

  return (
    <div className="h-full overflow-y-auto p-2">
      <p className="text-xs text-slate-600 uppercase tracking-wider font-medium px-2 mb-2">
        Project Files
      </p>
      {tree.map((node) => (
        <TreeNodeView
          key={node.path}
          node={node as TreeNode}
          selectedFile={selectedFile}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
