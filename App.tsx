/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { generateImage, analyzeMediaContent, isQuotaError } from './services/geminiService';
import { GeneratedMedia, AnalysisResult, AudienceLevel } from './types';
import { AugmentedCanvas } from './components/AugmentedCanvas';
import { LoadingState } from './components/LoadingState';
import { Search, Plus, MessageSquarePlus, ChevronRight, Zap, Download, RefreshCw, AlertTriangle, Timer, ShieldAlert, Cpu, Activity, ExternalLink, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AppStatus = 'idle' | 'generating' | 'analyzing' | 'complete' | 'quota_limit';

const RPM_LIMIT_ESTIMATE = 12;

function App() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [refinement, setRefinement] = useState('');
  const [audience, setAudience] = useState<AudienceLevel>('sprout');
  const [status, setStatus] = useState<AppStatus>('idle');
  const [data, setData] = useState<{ media: GeneratedMedia; analysis: AnalysisResult | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLiteMode, setIsLiteMode] = useState(false);
  
  const [requestCount, setRequestCount] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const expiry = localStorage.getItem('lumina_cooldown_expiry');
    if (expiry) {
      const remaining = Math.max(0, Math.ceil((parseInt(expiry) - Date.now()) / 1000));
      if (remaining > 0) {
        setCooldownRemaining(remaining);
        setStatus('quota_limit');
      } else {
        localStorage.removeItem('lumina_cooldown_expiry');
      }
    }

    const monitor = setInterval(() => {
      setRequestCount(prev => Math.max(0, prev - 1));
    }, 5000); 
    
    return () => clearInterval(monitor);
  }, []);

  useEffect(() => {
    let timer: number;
    if (cooldownRemaining > 0) {
      timer = window.setInterval(() => {
        setCooldownRemaining(prev => {
          const next = prev - 1;
          if (next <= 0) {
            localStorage.removeItem('lumina_cooldown_expiry');
            setStatus('idle');
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const triggerCooldown = (seconds = 60) => {
    const expiry = Date.now() + (seconds * 1000);
    localStorage.setItem('lumina_cooldown_expiry', expiry.toString());
    setCooldownRemaining(seconds);
    setStatus('quota_limit');
  };

  const incrementUsage = () => setRequestCount(prev => prev + 1);

  const processSearch = async (searchQuery: string, level: AudienceLevel = audience) => {
    if (!searchQuery.trim() || status === 'quota_limit') return;

    setActiveQuery(searchQuery);
    setQuery(searchQuery);
    setStatus('generating');
    setError(null);
    try {
      incrementUsage();
      const media = await generateImage(searchQuery);
      setData({ media, analysis: null });
      
      setStatus('analyzing');
      incrementUsage();
      const analysis = await analyzeMediaContent(searchQuery, media.url, level, isLiteMode);
      setData({ media, analysis });
      setStatus('complete');
    } catch (err: any) {
      console.error("Application Process Error Detected:", err);
      if (isQuotaError(err)) {
        triggerCooldown();
      } else {
        setError(err.message || 'The neural core failed to synthesize this request.');
        setStatus('idle');
      }
    }
  };

  const handleRefine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinement.trim() || status === 'quota_limit') return;
    const base = activeQuery || query || "visualization";
    const combined = `${base}. Iteration refinement: ${refinement}`;
    processSearch(combined);
    setRefinement('');
  };

  const handleDownload = () => {
    if (!data?.media.url) return;
    if (data.media.url.startsWith('data:image/svg+xml')) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 1200;
        canvas.height = img.height || 675;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `lumina-capture-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };
      img.src = data.media.url;
    } else {
      const link = document.createElement('a');
      link.href = data.media.url;
      link.download = `lumina-capture-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const quotaPercent = Math.min((requestCount / RPM_LIMIT_ESTIMATE) * 100, 100);

  return (
    <div className="h-screen w-screen bg-[#020202] text-white overflow-hidden flex flex-col font-sans">
      <header className="relative z-50 flex justify-between items-center p-6 bg-black/50 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 180 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-black text-black text-xs shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            L
          </motion.div>
          <div>
            <span className="text-xl font-black tracking-tighter uppercase block leading-none">Lumina</span>
            <span className="text-[8px] font-bold text-cyan-400 tracking-[0.3em] uppercase opacity-60">Visual Neural Core</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isLiteMode ? 'text-amber-400 animate-pulse' : 'text-white/40'}`}>
              Lite Mode
            </span>
            <button 
              onClick={() => setIsLiteMode(!isLiteMode)}
              className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isLiteMode ? 'bg-amber-500/50' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: isLiteMode ? 22 : 2 }}
                className="w-4 h-4 rounded-full bg-white absolute top-0.5" 
              />
            </button>
          </div>

          <div className="hidden lg:flex flex-col items-end gap-1.5 w-40">
            <div className="flex justify-between w-full text-[8px] font-black uppercase tracking-[0.2em]">
              <span className={status === 'quota_limit' ? 'text-red-500' : 'text-white/40'}>
                {status === 'quota_limit' ? 'Locked' : 'Neural Load'}
              </span>
              <span className={quotaPercent > 80 || status === 'quota_limit' ? 'text-red-500 animate-pulse' : 'text-cyan-400'}>
                {status === 'quota_limit' ? `REST IN ${cooldownRemaining}S` : `${Math.round(quotaPercent)}%`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ 
                   width: status === 'quota_limit' ? `${(cooldownRemaining/60)*100}%` : `${quotaPercent}%`,
                   backgroundColor: status === 'quota_limit' ? '#ef4444' : (quotaPercent > 80 ? '#ef4444' : quotaPercent > 50 ? '#f59e0b' : '#06b6d4')
                 }}
                 className="h-full shadow-[0_0_10px_rgba(34,211,238,0.4)]"
               />
            </div>
          </div>

          {status !== 'idle' && (
            <button 
              disabled={status === 'quota_limit'}
              onClick={() => { setStatus('idle'); setError(null); }} 
              className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 disabled:opacity-30"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:inline">Initialize</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          {status === 'quota_limit' ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} 
               animate={{ opacity: 1, scale: 1 }} 
               exit={{ opacity: 0 }} 
               className="text-center p-10 bg-zinc-900/50 rounded-[4rem] border border-red-500/20 backdrop-blur-3xl max-w-2xl mx-auto shadow-[0_0_120px_rgba(239,68,68,0.15)] ring-1 ring-red-500/10 overflow-y-auto max-h-[90vh] custom-scrollbar"
             >
               <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/30">
                 <ShieldAlert size={40} className="text-red-500" />
               </div>
               <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-red-500">Neural Core Exhausted</h2>
               
               <div className="space-y-6 text-left mb-10 px-4">
                 <p className="text-gray-400 font-light text-lg leading-relaxed text-center">
                   The Gemini API reports that your <strong>Daily Quota</strong> has been exceeded. This is a common limit for Free Tier users.
                 </p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <a 
                     href="https://ai.dev/usage?tab=rate-limit" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group no-underline"
                   >
                     <div className="flex items-center justify-between mb-2">
                       <Activity size={18} className="text-cyan-400" />
                       <ExternalLink size={12} className="text-white/20" />
                     </div>
                     <h4 className="text-white font-bold text-sm mb-1">Check Usage</h4>
                     <p className="text-[10px] text-gray-500 leading-tight">View your current daily and per-minute usage statistics.</p>
                   </a>
                   
                   <a 
                     href="https://ai.google.dev/gemini-api/docs/billing" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="bg-cyan-500/10 p-5 rounded-2xl border border-cyan-500/20 hover:bg-cyan-500/20 transition-all group no-underline"
                   >
                     <div className="flex items-center justify-between mb-2">
                       <CreditCard size={18} className="text-cyan-400" />
                       <ExternalLink size={12} className="text-white/20" />
                     </div>
                     <h4 className="text-white font-bold text-sm mb-1">Upgrade Tier</h4>
                     <p className="text-[10px] text-gray-500 leading-tight">Switch to Pay-as-you-go for significantly higher limits.</p>
                   </a>
                 </div>
               </div>
               
               <div className="flex flex-col items-center gap-6">
                 {!isLiteMode && (
                   <button 
                     onClick={() => { setIsLiteMode(true); setCooldownRemaining(0); setStatus('idle'); localStorage.removeItem('lumina_cooldown_expiry'); }}
                     className="px-10 py-5 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-amber-400 transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                   >
                     <Zap size={20} /> Try Lite Failover
                   </button>
                 )}
                 <div className="flex items-center gap-5 px-10 py-4 bg-black/60 border border-white/10 rounded-2xl">
                   <Timer size={24} className="text-red-400 animate-spin-slow" />
                   <span className="font-mono text-4xl font-black text-white">{cooldownRemaining}s</span>
                   <span className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-3">Re-syncing...</span>
                 </div>
               </div>
             </motion.div>
           ) : status === 'idle' ? (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl px-8 text-center">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="mb-6 inline-block px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em]"
               >
                 Neural Visual Core v2.8 {isLiteMode && "(Lite Activated)"}
               </motion.div>
               <h1 className="text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-[0.9] tracking-tighter uppercase">Augment Reality.</h1>
               <p className="text-gray-500 mb-12 text-2xl font-light">Transform complex descriptions into cinematic insights through neural synthesis.</p>
               
               <form onSubmit={(e) => { e.preventDefault(); processSearch(query); }} className="relative group">
                 <div className={`absolute -inset-1.5 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition-opacity duration-700 bg-gradient-to-r ${isLiteMode ? 'from-amber-500 to-orange-600' : 'from-cyan-500 to-purple-600'}`}></div>
                 <div className="relative bg-zinc-950 border border-white/10 rounded-[1.8rem] p-3 flex gap-3 shadow-2xl">
                    <input 
                     className="flex-1 bg-transparent px-6 py-5 outline-none text-2xl placeholder-white/20 font-light" 
                     placeholder="Describe what to synthesize..." 
                     value={query} 
                     onChange={e => setQuery(e.target.value)} 
                    />
                    <button 
                     disabled={!query.trim()} 
                     className={`px-10 rounded-2xl font-black transition-all duration-300 disabled:opacity-50 active:scale-95 shadow-xl ${isLiteMode ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-white text-black hover:bg-cyan-400'}`}
                    >
                     <Search size={26} />
                    </button>
                 </div>
               </form>
               {isLiteMode && (
                 <p className="mt-6 text-amber-500/60 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                   <Cpu size={12} /> Neural efficiency mode enabled
                 </p>
               )}
               {error && <p className="mt-10 text-red-400 text-sm font-mono tracking-wide uppercase flex items-center justify-center gap-2"><AlertTriangle size={14} /> {error}</p>}
             </motion.div>
           ) : status === 'generating' || status === 'analyzing' ? (
             <LoadingState key="loader" />
           ) : (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full p-4 flex flex-col">
               <div className="flex-1 relative">
                 <AugmentedCanvas image={data?.media.url} analysis={data?.analysis} isScanning={status === 'analyzing'} />
                 {status === 'complete' && (
                   <>
                     <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 flex gap-4">
                       <form onSubmit={handleRefine} className="bg-black/90 backdrop-blur-3xl border border-white/10 rounded-full p-2 pl-10 flex-1 flex items-center gap-4 shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
                         <MessageSquarePlus size={22} className="text-cyan-400" />
                         <input className="bg-transparent flex-1 outline-none text-lg h-14" placeholder="Iterate on this visualization..." value={refinement} onChange={e => setRefinement(e.target.value)} />
                         <button className="p-4 bg-white text-black rounded-full hover:bg-cyan-400 transition-all active:scale-90 shadow-lg"><ChevronRight size={26} /></button>
                       </form>
                     </div>
                     
                     <div className="absolute bottom-12 right-12 flex flex-col gap-6">
                       <motion.button 
                         whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
                         whileTap={{ scale: 0.9 }}
                         onClick={() => processSearch(query)}
                         className="p-5 bg-zinc-900/90 backdrop-blur-3xl border border-white/10 text-white rounded-3xl shadow-2xl flex items-center justify-center ring-1 ring-white/5"
                         title="Regenerate Visualization"
                       >
                         <RefreshCw size={28} />
                       </motion.button>
                       
                       <motion.button 
                         whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
                         whileTap={{ scale: 0.9 }}
                         onClick={handleDownload}
                         className="p-5 bg-zinc-900/90 backdrop-blur-3xl border border-white/10 text-white rounded-3xl shadow-2xl flex items-center justify-center ring-1 ring-white/5"
                         title="Export high-res"
                       >
                         <Download size={28} />
                       </motion.button>
                     </div>
                   </>
                 )}
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </main>
     </div>
   );
 }

 export default App;
