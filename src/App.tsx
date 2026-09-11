import React, { useState } from 'react';
import { ArchitectureView } from './components/ArchitectureView';
import { ApiSimulator } from './components/ApiSimulator';
import { CodeExplorer } from './components/CodeExplorer';
import { KeycloakGuide } from './components/KeycloakGuide';
import { ShieldCheck, Database, KeyRound, Code2, Terminal, BookOpen, Layers, Download, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import { CODEBASE_FILES } from './data/codebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'simulator' | 'code' | 'keycloak'>('architecture');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('user-auth-service');
      CODEBASE_FILES.forEach(file => {
        folder?.file(file.path, file.content);
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-sky-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">user-auth-service</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Senior Backend Architect Reference: Spring Boot 3.4.2 • Keycloak 24+ • PostgreSQL (mydb)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportZip}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Packaging...' : 'Download Project ZIP'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Architecture & Data Split</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Interactive API Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Production Codebase ({CODEBASE_FILES.length} Files)</span>
          </button>

          <button
            onClick={() => setActiveTab('keycloak')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'keycloak'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Keycloak 24+ Realm Setup</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'simulator' && <ApiSimulator />}
        {activeTab === 'code' && <CodeExplorer />}
        {activeTab === 'keycloak' && <KeycloakGuide />}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 lg:px-8 mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>
          Designed according to Enterprise Microservices Architecture standards: Spring Boot 3.4.2, Java 21, Keycloak 24+ Admin REST API, Spring Security 6 Resource Server, and PostgreSQL Dual-Store Saga.
        </p>
      </footer>
    </div>
  );
}
