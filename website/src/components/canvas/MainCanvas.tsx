"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, ReactNode } from "react";
import { Preload } from "@react-three/drei";
import PostProcessing from "./PostProcessing";

interface MainCanvasProps {
  children: ReactNode;
}

export default function MainCanvas({ children }: MainCanvasProps) {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-0">
      <Canvas
        gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 2]} // clamp device pixel ratio for performance
        camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 50000 }}
      >
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          {children}
          <PostProcessing />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
