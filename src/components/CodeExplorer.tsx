import React, { useState } from 'react';
import { CODEBASE_FILES, CodeFile } from '../data/codebase';
import { FileCode, Copy, Check, Download, Search, Folder, Shield, Database, Cpu, FileText } from 'lucide-react';
import JSZip from 'jszip';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(CODEBASE_FILES[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'config', label: 'Config & Security' },
    { id: 'controller', label: 'Controllers' },
    { id: 'service', label: 'Services (Saga)' },
    { id: 'entity', label: 'Entities & Repos' },
    { id: 'dto', label: 'DTOs' },
    { id: 'infra', label: 'Flyway & Docker' },
    { id: 'docs', label: 'Docs' }
  ];

  const filteredFiles = CODEBASE_FILES.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          file.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder('user-auth-service');

      CODEBASE_FILES.forEach(file => {
        rootFolder?.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user-auth-service-spring-boot-3.4.2.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-slate-400 font-mono">
            {filteredFiles.length} of {CODEBASE_FILES.length} files
          </span>
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Bundling ZIP...' : 'Export Complete Project (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Main File Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* File Tree Left: 4 columns */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-3 max-h-[640px] overflow-y-auto space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>user-auth-service/</span>
          </div>

          {filteredFiles.map(file => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex flex-col gap-0.5 transition-all ${
                  isSelected
                    ? 'bg-indigo-950/70 text-indigo-200 border border-indigo-700/60 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="font-semibold text-slate-200 truncate">{file.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 truncate pl-5 font-sans">
                  {file.path}
                </span>
              </button>
            );
          })}
        </div>

        {/* Code Content Right: 8 columns */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white">{selectedFile.name}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xl">{selectedFile.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="p-4 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto max-h-[580px] overflow-y-auto leading-relaxed border-t border-slate-900">
            <pre className="text-slate-200">
              {selectedFile.content.split('\n').map((line, idx) => (
                <div key={idx} className="flex hover:bg-slate-900/50 -mx-4 px-4">
                  <span className="w-10 select-none text-slate-600 text-right pr-4 shrink-0">{idx + 1}</span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
