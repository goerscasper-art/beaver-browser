import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, ArrowRight, Globe } from 'lucide-react';
import beaverImg from './assets/images/real_beaver_photo_1789620274150.jpg';

const SEARCH_ENGINES = [
  { id: 'duckduckgo', name: 'DuckDuckGo', prefix: 'https://duckduckgo.com/?q=' },
  { id: 'duckduckgo_lite', name: 'DuckDuckGo (Lite)', prefix: 'https://lite.duckduckgo.com/lite/?q=' },
  { id: 'searx', name: 'SearXNG (Google/Bing Proxy)', prefix: 'https://searx.be/search?q=' }
];

export default function App() {
  const [mode, setMode] = useState<'search' | 'direct'>('search');
  const [input, setInput] = useState('');
  const [iframeSrc, setIframeSrc] = useState('');
  const [engine, setEngine] = useState(SEARCH_ENGINES[0]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'proxy_navigate' && e.data.url) {
        const b64url = btoa(e.data.url);
        setIframeSrc(`/api/proxy?b64url=${b64url}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    let targetUrl = '';
    if (mode === 'search') {
      targetUrl = `${engine.prefix}${encodeURIComponent(input)}`;
    } else {
      targetUrl = input.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `https://${targetUrl}`;
      }
    }
    
    // Route through our backend proxy to keep it completely separate from on-device access.
    // When published to Cloudflare, the public/_worker.js script handles this route.
    const b64url = btoa(targetUrl);
    setIframeSrc(`/api/proxy?b64url=${b64url}`);
  };

  return (
    <div className="min-h-screen bg-[#202020] text-gray-100 flex flex-col font-['Segoe_UI_Variable','Segoe_UI',system-ui,sans-serif] selection:bg-blue-500/30">
      {/* Header */}
      <header className="bg-[#2c2c2c]/80 backdrop-blur-xl border-b border-white/10 p-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <img src={beaverImg} alt="Beaver Logo" className="w-10 h-10 object-cover shadow-sm" />
          <h1 className="text-sm font-semibold tracking-wide text-gray-100">Beaver</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {!iframeSrc ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#202020]">
            <div className="w-full max-w-2xl flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-300">
              
              <div className="text-center flex flex-col items-center">
                <img src={beaverImg} alt="Beaver" className="w-48 h-48 object-cover mb-4 shadow-md" />
                <h2 className="text-3xl font-semibold text-gray-100 tracking-tight">Beaver</h2>
              </div>

              <div className="w-full bg-white/[0.03] backdrop-blur-xl rounded-md p-2 border border-white/10 shadow-xl">
                <div className="flex p-1 mb-4 gap-1">
                  <button
                    onClick={() => setMode('search')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'search' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'}`}
                  >
                    <Search className="w-4 h-4" />
                    Web Search
                  </button>
                  <button
                    onClick={() => setMode('direct')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'direct' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'}`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Direct Link
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                  {mode === 'search' && (
                    <select
                      value={engine.id}
                      onChange={(e) => setEngine(SEARCH_ENGINES.find(eng => eng.id === e.target.value) || SEARCH_ENGINES[0])}
                      className="bg-white/5 border border-white/10 rounded-md py-3 px-3 text-sm text-gray-200 outline-none focus:border-blue-400/50 focus:bg-white/10 transition-colors appearance-none cursor-pointer"
                    >
                      {SEARCH_ENGINES.map(eng => (
                        <option key={eng.id} value={eng.id} className="bg-[#2c2c2c] text-gray-100">
                          {eng.name}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                      {mode === 'search' ? <Search className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                    </div>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={mode === 'search' ? "Search the web..." : "Paste a link (e.g., example.com)"}
                      className="w-full bg-white/5 border border-white/10 rounded-md py-3 pl-10 pr-12 text-gray-100 placeholder:text-gray-500 focus:bg-white/10 focus:border-blue-400/50 outline-none transition-all text-sm shadow-inner"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="absolute inset-y-1.5 right-1.5 bg-blue-500 hover:bg-blue-400 disabled:bg-white/5 disabled:text-gray-600 text-white px-3 rounded text-sm flex items-center justify-center transition-all disabled:cursor-not-allowed border border-blue-400/50 disabled:border-transparent"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col bg-[#ffffff]">
            <div className="bg-[#2c2c2c] p-2 flex items-center gap-3 border-b border-white/10 text-sm shadow-sm z-10">
               <button
                onClick={() => setIframeSrc('')}
                className="px-3 py-1.5 hover:bg-white/10 border border-transparent rounded-md text-gray-300 hover:text-white transition-colors flex items-center gap-2 font-medium"
               >
                 <span>&larr;</span> Back
               </button>
               <div className="flex-1 truncate text-gray-300 font-sans text-xs bg-[#1e1e1e] px-3 py-1.5 rounded-md border border-white/10 flex items-center gap-2">
                 <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                 {iframeSrc.includes('b64url=') ? atob(new URLSearchParams(iframeSrc.split('?')[1]).get('b64url') || '') : iframeSrc}
               </div>
            </div>
            <div className="flex-1 relative bg-gray-100">
              {/* Loading State underlying iframe */}
              <div className="absolute inset-0 flex items-center justify-center bg-[#f3f3f3]">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-xs font-medium">Loading...</p>
                </div>
              </div>
              <iframe
                src={iframeSrc}
                className="absolute inset-0 w-full h-full bg-transparent border-none z-10"
                title="Beaver Viewport"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
