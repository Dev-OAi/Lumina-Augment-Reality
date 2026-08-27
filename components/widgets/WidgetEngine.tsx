
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Segment, ActionItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface WidgetProps {
  segment: Segment;
}

// ----------------------------------------------------------------------
// Shared Variants
// ----------------------------------------------------------------------
const GLASS_PANEL = "bg-black/95 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] w-full max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } }
};

// ----------------------------------------------------------------------
// Sub-component: Description with Smooth Animated Expansion
// ----------------------------------------------------------------------
const TruncatedDescription: React.FC<{ text: string }> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 160;
  const isLong = text.length > maxLength;

  return (
    <div className="space-y-2">
      <motion.div 
        layout
        initial={false}
        animate={{ height: "auto" }}
        className="overflow-hidden"
      >
        <p className="text-base text-gray-300 leading-relaxed font-light transition-all duration-300">
          {isExpanded || !isLong ? text : `${text.substring(0, maxLength)}...`}
        </p>
      </motion.div>
      
      {isLong && (
        <motion.button
          layout
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors group py-2"
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.span 
                key="less"
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1"
              >
                Condense <ChevronUp size={14} />
              </motion.span>
            ) : (
              <motion.span 
                key="more"
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1"
              >
                Expand Context <ChevronDown size={14} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  );
};

const RenderActions: React.FC<{ actions?: ActionItem[] }> = ({ actions }) => {
  if (!actions || actions.length === 0) return null;
  return (
    <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-white/10">
      {actions.map((action, i) => (
        <motion.a
          key={i}
          href={action.url}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05, backgroundColor: "rgba(34, 211, 238, 0.2)", borderColor: "rgba(34, 211, 238, 0.5)" }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs font-bold text-cyan-200 transition-colors flex items-center gap-2 no-underline group/action"
          onClick={(e) => !action.url && e.preventDefault()}
        >
          <span>{action.label}</span>
          {action.url && <ExternalLink size={12} className="opacity-60 group-hover/action:opacity-100 transition-opacity" />}
        </motion.a>
      ))}
    </motion.div>
  );
};

// ----------------------------------------------------------------------
// Formats
// ----------------------------------------------------------------------

const MiniWidget: React.FC<WidgetProps> = ({ segment }) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="bg-black/95 backdrop-blur-md border border-cyan-500/30 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] mx-auto w-fit pointer-events-auto"
  >
    <span className="text-2xl">{segment.icon || '✨'}</span>
    <span className="text-lg font-bold text-white tracking-wide">{segment.label}</span>
  </motion.div>
);

const CompactWidget: React.FC<WidgetProps> = ({ segment }) => (
  <motion.div 
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className={`${GLASS_PANEL} p-6 rounded-2xl relative group overflow-hidden pointer-events-auto`}
  >
    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-transparent opacity-70" />
    
    <motion.div variants={itemVariants} className="flex items-start gap-5 mb-5">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0">
        {segment.icon || '🔍'}
      </div>
      <div className="pt-1">
        <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-bold mb-1">{segment.category || 'Context'}</div>
        <h3 className="font-bold text-white text-2xl leading-tight">{segment.label}</h3>
      </div>
    </motion.div>
    
    <motion.div variants={itemVariants}>
      <TruncatedDescription text={segment.description} />
    </motion.div>

    <RenderActions actions={segment.actions} />
  </motion.div>
);

const StatsWidget: React.FC<WidgetProps> = ({ segment }) => (
  <motion.div 
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className={`${GLASS_PANEL} p-6 rounded-2xl relative pointer-events-auto`}
  >
    <motion.div variants={itemVariants} className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
      <h3 className="font-bold text-white text-xl flex items-center gap-3">
        <span className="text-2xl">{segment.icon || '📊'}</span>
        <span>{segment.label}</span>
      </h3>
      <div className="px-3 py-1 rounded text-[10px] font-black bg-purple-500/20 text-purple-200 uppercase tracking-widest border border-purple-500/20">Telemetry</div>
    </motion.div>
    
    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
      {segment.stats?.map((stat, idx) => (
        <motion.div 
          key={idx} 
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
          className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-cyan-500/30 transition-all"
        >
            <div className="text-cyan-400 font-mono font-bold text-xl">{stat.value}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
    
    <motion.div variants={itemVariants} className="mt-6 border-t border-white/5 pt-4">
      <TruncatedDescription text={segment.description} />
    </motion.div>
    
    <RenderActions actions={segment.actions} />
  </motion.div>
);

const DetailedWidget: React.FC<WidgetProps> = ({ segment }) => (
  <motion.div 
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className={`${GLASS_PANEL} p-0 rounded-2xl flex flex-col pointer-events-auto`}
  >
    <motion.div variants={itemVariants} className="bg-gradient-to-br from-zinc-900 to-black border-b border-white/10 p-8 relative overflow-hidden shrink-0">
      <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
            <span className="inline-block px-3 py-1 rounded text-[10px] font-black bg-white/10 text-cyan-200 border border-cyan-500/20 uppercase tracking-[0.3em]">
                {segment.category || 'Deep Dive'}
            </span>
            <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{segment.icon || '🚀'}</span>
        </div>
        <h3 className="font-bold text-4xl text-white mb-2 leading-tight tracking-tight">{segment.label}</h3>
        <div className="w-16 h-1 bg-cyan-500 rounded-full" />
      </div>
    </motion.div>

    <div className="p-8 bg-black/40">
      <motion.div variants={itemVariants} className="mb-8">
        <TruncatedDescription text={segment.description} />
      </motion.div>

      {segment.stats && segment.stats.length > 0 && (
        <motion.div variants={itemVariants} className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-none">
          {segment.stats.map((stat, i) => (
             <motion.div 
              key={i} 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
              className="flex-shrink-0 bg-white/5 rounded-xl px-5 py-4 border border-white/5 min-w-[140px]"
             >
                <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">{stat.label}</div>
                <div className="text-white font-mono font-medium text-lg">{stat.value}</div>
             </motion.div>
          ))}
        </motion.div>
      )}

      <RenderActions actions={segment.actions} />
    </div>
  </motion.div>
);

export const WidgetEngine: React.FC<WidgetProps> = ({ segment }) => {
  switch (segment.format) {
    case 'mini': return <MiniWidget segment={segment} />;
    case 'stats': return <StatsWidget segment={segment} />;
    case 'detailed': return <DetailedWidget segment={segment} />;
    default: return <CompactWidget segment={segment} />;
  }
};
