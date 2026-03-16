'use client';

import { useLyraStore } from '@/store/useLyraStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function TextOverlay() {
  const currentAct = useLyraStore((state) => state.currentAct);
  const [show, setShow] = useState(false);
  
  const texts: Record<number, { title: string; subtitle: string; className?: string }> = {
    2: { title: 'Ve galaksiler doğdu...', subtitle: '13.8 milyar yıl önce' },
    3: { title: 'Satürn', subtitle: 'Güneş sisteminin mücevheri' },
    4: { title: 'Dünya', subtitle: 'Mavi gezegenimiz' },
    5: { title: 'İstanbul', subtitle: 'İki kıtanın buluştuğu şehir' },
    6: { title: '', subtitle: '', className: 'negative' },
    7: { title: '', subtitle: '', className: 'hope' },
  };

  const currentText = texts[currentAct];

  useEffect(() => {
    if (currentText && currentText.title) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [currentAct, currentText]);

  return (
    <div className="cinematic-overlay">
      <AnimatePresence>
        {show && currentText && (
          <motion.div 
            className={`cinematic-text ${currentText.className || ''}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1>{currentText.title}</h1>
            <p>{currentText.subtitle}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
