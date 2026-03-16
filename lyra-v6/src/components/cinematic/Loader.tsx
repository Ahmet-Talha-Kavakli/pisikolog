'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoaderProps {
  onLoaded: () => void;
}

export function Loader({ onLoaded }: LoaderProps) {
  const [percent, setPercent] = useState(0);
  const [subtitle, setSubtitle] = useState('Evrenin Temelleri Atılıyor...');

  const loadingSteps = [
    "Evrenin Temelleri Atılıyor...",
    "Galaksiler Sentezleniyor...",
    "Yörünge Hesaplamaları Yapılıyor...",
    "Atmosferik Veriler Çekiliyor...",
    "İstanbul Silüeti Çiziliyor...",
    "Nöral Bağlantılar Kuruluyor...",
    "Bilinç Hazırlanıyor..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onLoaded, 1000);
          return 100;
        }
        const next = prev + 1;
        const stepIdx = Math.floor((next / 100) * (loadingSteps.length - 1));
        setSubtitle(loadingSteps[stepIdx]);
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <motion.div 
      className="loader-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
    >
      <div className="flex flex-col items-center gap-10 relative">
        <div className="w-[120px] h-[120px] rounded-full border border-[#7C6FFF1A] border-t-2 border-t-[#7C6FFF] border-b-2 border-b-[#A78BFA] animate-spin shadow-[0_0_30px_rgba(124,111,255,0.2)]" />
        
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-['Space_Grotesk'] text-[38px] font-bold tracking-[24px] text-white uppercase bg-gradient-to-r from-[#7C6FFF] via-white to-[#A78BFA] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(124,111,255,0.4)] mr-[-24px]">
            LYRA
          </h1>
          <p className="text-[12px] font-medium text-[#7C6FFF]/70 tracking-[6px] uppercase mt-1">
            {percent === 100 ? 'SİSTEM ÇALIŞMAYA HAZIR' : subtitle}
          </p>
        </div>

        <div className="w-[300px] h-[2px] bg-white/5 relative rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#7C6FFF] shadow-[0_0_15px_#7C6FFF]"
            style={{ width: `${percent}%` }}
          />
        </div>
        
        <span className="font-['Space_Grotesk'] text-[11px] text-white/20 tracking-[2px] mt-2">
          {percent}%
        </span>
      </div>
    </motion.div>
  );
}
