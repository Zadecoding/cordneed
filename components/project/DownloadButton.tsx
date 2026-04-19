'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadButtonProps {
  projectId: string;
  projectName: string;
  isPro: boolean;
}

export default function DownloadButton({ projectId, projectName, isPro }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!isPro) {
      toast.error('ZIP download is a Pro feature. Upgrade to download your project.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/download/${projectId}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        isPro
          ? 'btn-primary'
          : 'border border-slate-700 text-slate-400 cursor-not-allowed opacity-60'
      } disabled:opacity-60`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin relative z-10" />
      ) : (
        <Download className="w-4 h-4 relative z-10" />
      )}
      <span className="relative z-10">{isPro ? 'Download ZIP' : 'ZIP (Pro Only)'}</span>
    </button>
  );
}
