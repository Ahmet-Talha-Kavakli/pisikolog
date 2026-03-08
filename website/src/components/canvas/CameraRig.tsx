"use client";

import { PerspectiveCamera, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export function CameraRig() {
  const scroll = useScroll(); // Returns scroll state { offset, pages, range, etc. }
  const cameraRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!cameraRef.current) return;
    
    // We drive the camera Z position based on total scroll offset
    // 40 pages * 1125 units/page = 45000 units total range
    const targetZ = -scroll.offset * 45000;
    cameraRef.current.position.z = THREE.MathUtils.lerp(
      cameraRef.current.position.z,
      targetZ,
      0.03
    );

    // Also update a global debug element if exists
    const debug = document.getElementById("scroll-debug");
    if (debug) debug.innerText = `OFFSET: ${scroll.offset.toFixed(4)}`;

    // Apply some slight mouse parallax and scroll tilt
    const mouseX = (state.pointer.x * Math.PI) / 6;
    const mouseY = (state.pointer.y * Math.PI) / 6;
    
    // Tilt the camera slightly based on mouse horizontal position
    const tiltZ = -state.pointer.x * 0.08;

    cameraRef.current.rotation.x = THREE.MathUtils.lerp(
      cameraRef.current.rotation.x,
      mouseY * 0.1,
      0.03
    );
    cameraRef.current.rotation.y = THREE.MathUtils.lerp(
      cameraRef.current.rotation.y,
      -mouseX * 0.1,
      0.03
    );
    cameraRef.current.rotation.z = THREE.MathUtils.lerp(
      cameraRef.current.rotation.z,
      tiltZ,
      0.03
    );
  });

  return (
    <group ref={cameraRef}>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
    </group>
  );
}
