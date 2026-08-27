
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingPhrases = [
  "Visualizing query context...",
  "Distilling artistic essence...",
  "Rendering high-detail layers...",
  "Synthesizing knowledge graph...",
  "Applying final enhancements..."
];

export const LoadingState: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % loadingPhrases.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex flex-col items-center">
      <div className="w-full aspect-video bg-zinc-900/40 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl backdrop-blur-sm">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
             <motion.div 
               animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.98, 1.02, 0.98] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl"
             />
        </div>
      </div>

      <div className="mt-12 h-8 relative flex justify-center items-center w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="text-gray-500 font-mono text-[10px] tracking-[0.3em] uppercase absolute text-center w-full"
          >
            {loadingPhrases[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
