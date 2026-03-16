'use client';

import { useLyraStore } from '@/store/useLyraStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function WellnessDashboard() {
  const userId = useLyraStore((state) => state.userId);
  const [stats, setStats] = useState<{ label: string, value: number, color: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId || !isOpen) return;

    const fetchStats = async () => {
      // Simulate data analysis from lyra_messages
      // In a real app, this would be an aggregation query
      setStats([
        { label: 'CALMNESS', value: 82, color: '#7C6FFF' },
        { label: 'INSIGHT', value: 65, color: '#A78BFA' },
        { label: 'RESILIENCE', value: 74, color: '#60A5FA' },
      ]);
    };

    fetchStats();
  }, [userId, isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-8 left-8 z-50 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white/60 text-[10px] tracking-widest hover:text-white transition-colors"
      >
        {isOpen ? 'CLOSE INSIGHTS' : 'WELLNESS MONITOR'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed top-24 left-8 z-50 w-72 bg-black/60 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl"
          >
            <h2 className="text-white text-xs font-bold tracking-[4px] mb-6 uppercase">Biological Sync</h2>
            
            <div className="space-y-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] text-white/40 font-medium">{stat.label}</span>
                    <span className="text-xs text-white font-mono">{stat.value}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[9px] text-white/30 leading-relaxed uppercase tracking-wider">
                Lyra is currently analyzing your neural patterns. Your resilience has increased by 12% since last session.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
