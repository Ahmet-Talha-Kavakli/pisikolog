'use client';

import { useLyraStore } from '@/store/useLyraStore';
import { useLyraBrain } from '@/hooks/useLyraBrain';
import { motion, AnimatePresence } from 'framer-motion';

export function EmpathyHUD() {
  const emotions = useLyraStore((state) => state.emotions);
  const isVapiConnected = useLyraStore((state) => state.isVapiConnected);
  const { isThinking, cognitiveInsight } = useLyraBrain();

  // Filter top 3 emotions with score > 0.1
  const activeEmotions = Object.entries(emotions)
    .filter(([, score]) => score > 0.1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (!isVapiConnected) return null;

  return (
    <div className="fixed top-24 right-8 z-50 pointer-events-none flex flex-col gap-2 items-end">
      <div className="text-[10px] text-[#7C6FFF]/60 tracking-[3px] uppercase mb-2">Neural Affect Sensor</div>
      <AnimatePresence>
        {activeEmotions.map(([name, score]) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg"
          >
            <div className="text-xs font-semibold text-white/80 w-24">{name}</div>
            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-linear-to-r from-[#7C6FFF] to-[#A78BFA]"
                    animate={{ width: `${score * 100}%` }}
                />
            </div>
            <div className="text-[10px] font-mono text-[#7C6FFF]">{(score * 100).toFixed(0)}%</div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 p-4 rounded-xl bg-blue-500/20 border border-blue-500/40 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">OEB DÜŞÜNÜYOR...</span>
            </div>
            {cognitiveInsight && (
               <motion.p 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="mt-2 text-white/80 text-[10px] leading-relaxed italic"
               >
                 &quot;{cognitiveInsight}&quot;
               </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
