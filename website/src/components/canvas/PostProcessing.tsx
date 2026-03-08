"use client";

import { EffectComposer, Bloom, Noise, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom 
        intensity={1.5} 
        luminanceThreshold={0.2} 
        luminanceSmoothing={0.9} 
        height={300} 
      />
      <Noise 
        opacity={0.05} 
        blendFunction={BlendFunction.OVERLAY} 
      />
      <ChromaticAberration 
        offset={[0.002, 0.002]} 
        blendFunction={BlendFunction.NORMAL} 
      />
      <Vignette 
        eskil={false} 
        offset={0.1} 
        darkness={1.1} 
      />
    </EffectComposer>
  );
}
