'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getFileLanguage } from '@/lib/utils';

interface CodeViewerProps {
  filename: string;
  content: string;
}

// Token-based syntax highlighting (no external deps needed)
function highlightCode(code: string, lang: string): string {
  // Escape HTML first
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (['typescript', 'tsx', 'javascript', 'jsx'].includes(lang)) {
    // Keywords
    highlighted = highlighted.replace(
      /\b(import|export|default|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|async|await|try|catch|throw|new|typeof|instanceof|in|of|null|undefined|true|false|void|string|number|boolean|any|never)\b/g,
      '<span style="color:#c792ea">$1</span>'
    );
    // Strings
    highlighted = highlighted.replace(
      /(`[^`]*`|'[^']*'|"[^"]*")/g,
      '<span style="color:#c3e88d">$1</span>'
    );
    // Comments
    highlighted = highlighted.replace(
      /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g,
      '<span style="color:#546e7a">$1</span>'
    );
    // Functions
    highlighted = highlighted.replace(
      /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
      '<span style="color:#82aaff">$1</span>'
    );
    // JSX components
    highlighted = highlighted.replace(
      /&lt;([A-Z][a-zA-Z0-9]*)/g,
      '&lt;<span style="color:#ffcb6b">$1</span>'
    );
    // Numbers
    highlighted = highlighted.replace(
      /\b(\d+\.?\d*)\b/g,
      '<span style="color:#f78c6c">$1</span>'
    );
  } else if (lang === 'json') {
    // JSON keys
    highlighted = highlighted.replace(
      /"([^"]+)":/g,
      '"<span style="color:#c792ea">$1</span>":'
    );
    // String values
    highlighted = highlighted.replace(
      /:\s*"([^"]*)"/g,
      ': "<span style="color:#c3e88d">$1</span>"'
    );
    // Numbers/booleans
    highlighted = highlighted.replace(
      /:\s*(\d+|true|false|null)/g,
      ': <span style="color:#f78c6c">$1</span>'
    );
  }

  return highlighted;
}

export default function CodeViewer({ filename, content }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const lang = getFileLanguage(filename);
  const lines = content.split('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = highlightCode(content, lang);
  const highlightedLines = highlighted.split('\n');

  return (
    <div className="flex flex-col h-full">
      {/* File header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#080f20] border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-slate-400 font-mono ml-1">{filename}</span>
          <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono uppercase">
            {lang}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
          ) : (
            <><Copy className="w-3.5 h-3.5" />Copy</>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto bg-[#050d1a] code-viewer">
        <table className="min-w-full border-collapse">
          <tbody>
            {highlightedLines.map((line, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                <td className="pl-4 pr-6 py-0 text-right text-slate-700 text-xs select-none w-10 flex-shrink-0 align-top" style={{ minWidth: '48px', paddingTop: '2px', paddingBottom: '2px' }}>
                  {i + 1}
                </td>
                <td className="pr-8 align-top" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                  <pre
                    className="text-slate-300 whitespace-pre text-xs leading-relaxed m-0 p-0 font-mono"
                    dangerouslySetInnerHTML={{ __html: line || ' ' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-[#080f20] border-t border-slate-800 text-[10px] text-slate-600 flex-shrink-0">
        <span>{lines.length} lines</span>
        <span>{content.length} chars</span>
        <span className="capitalize">{lang}</span>
      </div>
    </div>
  );
}
