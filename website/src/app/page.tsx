"use client";

import dynamic from "next/dynamic";

const SceneRenderer = dynamic(() => import("@/components/SceneRenderer"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="w-full h-screen bg-black relative overflow-hidden">
      <SceneRenderer />
      
      {/* Scroll Debug Panel (Only visible in dev or if you know where it is) */}
      <div id="scroll-debug" className="fixed top-4 left-4 z-[200] text-[#8b5cf6] font-mono text-xs opacity-50 pointer-events-none">
        OFFSET: 0.0000
      </div>

      {/* Basic Text Overlay */}
      <div id="hero-overlay" className="fixed inset-0 flex flex-col items-center justify-center text-center z-10 mix-blend-difference pointer-events-none transition-opacity duration-1000">
        <h1 className="cinematic-text text-white text-4xl sm:text-6xl md:text-8xl tracking-[0.4em] font-light">LYRA</h1>
        <p className="mt-6 text-white/40 text-[10px] md:text-xs uppercase tracking-[0.5em] animate-pulse">
          Scroll to explore the universe
        </p>
      </div>
    </main>
  );
}
