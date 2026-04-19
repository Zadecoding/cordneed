'use client';

import { useState } from 'react';
import FileTree from '@/components/project/FileTree';
import CodeViewer from '@/components/project/CodeViewer';
import DownloadButton from '@/components/project/DownloadButton';
import { ArrowLeft, Calendar, FileCode, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  prompt: string;
  status: string;
  created_at: string;
}

interface Props {
  project: Project;
  files: Record<string, string>;
  isPro: boolean;
}

export default function ProjectDetailClient({ project, files, isPro }: Props) {
  const fileKeys = Object.keys(files);
  const [selectedFile, setSelectedFile] = useState<string | null>(fileKeys[0] || null);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 bg-[#060d1a] flex-shrink-0">
        <Link
          href="/projects"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-white font-[family-name:var(--font-space-grotesk)] text-sm truncate">
              {project.name}
            </h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                project.status === 'done'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : project.status === 'error'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {project.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {formatDate(project.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <FileCode className="w-2.5 h-2.5" />
              {fileKeys.length} files
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {isPro ? 'Pro' : 'Free'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <DownloadButton
            projectId={project.id}
            projectName={project.name}
            isPro={isPro}
          />
        </div>
      </div>

      {project.status !== 'done' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <p className="text-white font-semibold mb-1">
              {project.status === 'error' ? 'Generation Failed' : 'Generating...'}
            </p>
            <p className="text-slate-500 text-sm">
              {project.status === 'error'
                ? 'Something went wrong. Please try creating a new project.'
                : 'Your app is being generated. Please wait and refresh...'}
            </p>
            {project.status !== 'error' && (
              <div className="mt-4 w-40 bg-slate-800 rounded-full h-1 mx-auto">
                <div className="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse w-2/3" />
              </div>
            )}
          </div>
        </div>
      ) : fileKeys.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">No files found in this project.</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree */}
          <div className="w-52 lg:w-64 bg-[#060d1a] border-r border-slate-800/60 flex-shrink-0 overflow-hidden">
            <FileTree
              files={files}
              selectedFile={selectedFile}
              onSelect={setSelectedFile}
            />
          </div>

          {/* Code Viewer */}
          <div className="flex-1 overflow-hidden">
            {selectedFile && files[selectedFile] !== undefined ? (
              <CodeViewer filename={selectedFile} content={files[selectedFile]} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600">
                <p>Select a file to view its code</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
