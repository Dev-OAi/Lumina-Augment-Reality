
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { WidgetEngine } from './widgets/WidgetEngine';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  image?: string;
  analysis?: AnalysisResult | null;
  isScanning?: boolean;
}

export const AugmentedCanvas: React.FC<Props> = ({ analysis, isScanning = false, image }) => {
  const [hoveredSegmentId, setHoveredSegmentId] = useState<number | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);

  const selectedSegment = selectedSegmentId !== null && analysis?.segments ? analysis.segments[selectedSegmentId] : null;

  const handleMarkerClick = (index: number) => {
    setSelectedSegmentId(index);
    setHoveredSegmentId(null);
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative p-4 select-none">
      <div className="relative w-full aspect-video max-w-6xl mx-auto rounded-[3rem] overflow-hidden border border-white/10 bg-zinc-950 shadow-[0_0_100px_rgba(0,0,0,0.9)]">
        {image && (
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ 
              scale: selectedSegmentId !== null ? 1.08 : 1, 
              opacity: 1,
              filter: selectedSegmentId !== null ? 'blur(15px) brightness(0.2)' : 'blur(0px) brightness(1)'
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            src={image} 
            alt="Augmented Visualization"
            className="w-full h-full object-cover" 
          />
        )}

        {/* Cinematic Scan Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] z-10" />
        <div className="scanline" />

        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center"
            >
               <motion.div 
                 animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                 transition={{ rotate: { repeat: Infinity, duration: 3, ease: "linear" }, scale: { repeat: Infinity, duration: 2 } }}
                 className="w-24 h-24 border-t-2 border-r-2 border-cyan-400 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.5)]" 
               />
               <motion.div className="mt-8 flex flex-col items-center gap-2">
                 <motion.p 
                   animate={{ opacity: [0.4, 1, 0.4] }}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                   className="font-mono text-[10px] tracking-[0.8em] text-cyan-400 uppercase font-black"
                  >
                    Neural Synthesis Phase
                  </motion.p>
                  <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden mt-2">
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-full h-full bg-cyan-500"
                    />
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Augmented Markers Layer */}
        <div className="absolute inset-0 z-40 pointer-events-none">
          <AnimatePresence>
            {!isScanning && selectedSegmentId === null && analysis?.segments?.map((segment, index) => {
              const isHovered = hoveredSegmentId === index;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ 
                    delay: index * 0.08, 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 30 
                  }}
                  style={{
                    position: 'absolute',
                    left: `${segment.bounds.x}%`,
                    top: `${segment.bounds.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="pointer-events-auto"
                >
                  {/* Stable Hit Area Container - Unified for Marker + Tooltip */}
                  <div 
                    onMouseEnter={() => setHoveredSegmentId(index)}
                    onMouseLeave={() => setHoveredSegmentId(null)}
                    onClick={() => handleMarkerClick(index)}
                    className="relative flex items-center justify-center"
                  >
                    {/* Visual Node */}
                    <div className="w-16 h-16 flex items-center justify-center relative cursor-pointer">
                      <motion.div 
                        animate={{ 
                          scale: isHovered ? [1, 2.2] : [1, 1.5], 
                          opacity: isHovered ? [0.6, 0] : [0.2, 0] 
                        }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                        className="absolute w-10 h-10 rounded-full border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]" 
                      />
                      <motion.div 
                        animate={{ 
                          scale: isHovered ? 1.4 : 1,
                          backgroundColor: isHovered ? "#ffffff" : "#00E5FF",
                          boxShadow: isHovered 
                            ? "0 0 30px rgba(255,255,255,0.8), 0 0 15px rgba(0,229,255,0.6)" 
                            : "0 0 15px rgba(0,229,255,0.4)"
                        }}
                        className="w-5 h-5 rounded-full border-2 border-white/80 z-20 transition-colors" 
                      />
                    </div>

                    {/* Scrollable HUD Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, x: -10, scale: 0.95, filter: 'blur(15px)' }}
                          animate={{ opacity: 1, x: 28, scale: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, x: -5, scale: 0.98, filter: 'blur(10px)' }}
                          className="absolute left-full flex items-center z-[100] pl-4"
                        >
                          {/* HUD Connection Bridge */}
                          <div className="w-10 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent shrink-0 opacity-50" />
                          
                          {/* The Container */}
                          <div className="w-80 max-h-[420px] overflow-hidden bg-black/95 backdrop-blur-3xl rounded-[1.5rem] border border-white/10 flex flex-col shadow-[0_30px_90px_rgba(0,0,0,0.9)] ring-1 ring-white/5">
                            {/* Scrollable Content */}
                            <div className="overflow-y-auto p-6 space-y-5 custom-scrollbar">
                              <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                                <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{segment.icon}</span>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 leading-none mb-1">Trace Found</span>
                                  <span className="text-sm font-black uppercase tracking-widest text-white">
                                    {segment.label}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[12px] text-gray-400 leading-relaxed font-normal">
                                {segment.description}
                              </p>

                              {segment.stats && segment.stats.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                  {segment.stats.map((stat, i) => (
                                    <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-colors">
                                      <div className="text-[8px] text-gray-500 uppercase font-black tracking-tighter mb-1">{stat.label}</div>
                                      <div className="text-[11px] text-cyan-300 font-mono font-bold">{stat.value}</div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {segment.actions && segment.actions.length > 0 && (
                                <div className="flex flex-col gap-2.5 pt-4 border-t border-white/10">
                                  {segment.actions.map((action, i) => (
                                    <a
                                      key={i}
                                      href={action.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-3 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-center transition-all text-white no-underline flex items-center justify-center gap-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {action.label}
                                    </a>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-center gap-2 pt-2 pb-1 opacity-40">
                                <div className="h-[1px] w-4 bg-white/20" />
                                <span className="text-[8px] text-white font-black uppercase tracking-[0.4em]">
                                  Click to Link
                                </span>
                                <div className="h-[1px] w-4 bg-white/20" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Detail Modal - Focus Mode */}
      <AnimatePresence>
        {selectedSegment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSegmentId(null)}
              className="absolute inset-0 bg-black/40 pointer-events-auto cursor-zoom-out backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 60, filter: 'blur(30px)' }} 
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }} 
              exit={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(20px)' }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
              className="pointer-events-auto w-full max-w-xl relative"
            >
              <WidgetEngine segment={selectedSegment} />
              
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSegmentId(null)}
                className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white text-black px-14 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.6em] transition-all hover:bg-cyan-400 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto"
              >
                Close Trace
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};