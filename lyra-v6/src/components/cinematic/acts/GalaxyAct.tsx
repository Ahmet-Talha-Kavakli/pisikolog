'use client';

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';

interface GalaxyActProps {
  visible: boolean;
}

const GALAXY_CLUSTERS = [
  { pos: [0, 0, -100], size: 55, count: 60000, type: 'spiral', arms: 5, col1: '#7c6fff', col2: '#ffffff' },
  { pos: [-160, 60, -300], size: 30, count: 30000, type: 'cloud', col1: '#ff8844', col2: '#ffcc88' },
  { pos: [190, -40, -450], size: 35, count: 35000, type: 'ring', col1: '#44ffcc', col2: '#ffffff' },
  { pos: [-200, -120, -700], size: 25, count: 20000, type: 'elliptical', col1: '#ff44aa', col2: '#ffccff' },
  { pos: [300, 150, -900], size: 25, count: 25000, type: 'spiral', arms: 4, col1: '#44aaff', col2: '#ddffff' },
];

const GALAXY_VS = `
    uniform float uTime; uniform float uProgress; uniform float uAudio;
    attribute vec3 aTarget; attribute vec3 aDustColor; attribute vec3 aStarColor; attribute float aSize; attribute float aOffset;
    varying vec3 vColor; varying float vAlpha;
    void main() {
        float p = clamp(uProgress * 1.6 - aOffset * 0.4, 0.0, 1.0);
        float ease = p * p * (3.0 - 2.0 * p);
        vec3 pos = mix(position, aTarget, ease);
        vColor = mix(aDustColor, aStarColor, ease);
        float rotationSpeed = (0.01 + aOffset * 0.04) + (ease * 0.6) + uAudio * 2.0;
        float ang = uTime * rotationSpeed;
        float c = cos(ang); float s = sin(ang);
        float tx = pos.x * c - pos.z * s; float tz = pos.x * s + pos.z * c;
        pos.x = tx; pos.z = tz;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (aSize * (1.5 - ease * 0.5)) * (800.0 / -mv.z) * (1.0 + sin(uTime + aOffset * 10.0) * (0.1 + ease * 0.2));
        vAlpha = smoothstep(0.0, 0.1, uProgress) * (0.6 + ease * 0.4 + 0.2 * sin(uTime * 2.0 + aOffset * 50.0));
        gl_Position = projectionMatrix * mv;
    }
`;

const GALAXY_FS = `
    uniform float uAudio; uniform float uOpacity; varying vec3 vColor; varying float vAlpha;
    void main() {
        float dist = length(gl_PointCoord - 0.5);
        if (dist > 0.5) discard;
        float core = exp(-dist * 10.0) * 3.0;
        float halo = smoothstep(0.5, 0.0, dist);
        float brightness = (core + halo) * (1.0 + uAudio * 2.5);
        gl_FragColor = vec4(vColor * brightness, vAlpha * uOpacity);
    }
`;

function generateGalaxySystems(clusters: any[]) {
    return clusters.map(c => {
        const { size, count } = c;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const tar = new Float32Array(count * 3);
        const dustCol = new Float32Array(count * 3);
        const starCol = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const off = new Float32Array(count);

        const color1 = new THREE.Color(c.col1), color2 = new THREE.Color(c.col2);
        const darkDust = new THREE.Color(0x2a1b3d);

        for (let i = 0; i < count; i++) {
            const rInit = Math.pow(Math.random(), 0.6) * size * 7;
            const aInit = Math.random() * Math.PI * 2;
            pos[i * 3] = Math.cos(aInit) * rInit;
            pos[i * 3 + 1] = (Math.random() - 0.5) * size * 5;
            pos[i * 3 + 2] = Math.sin(aInit) * rInit;

            const dist = Math.pow(Math.random(), 0.9);
            if (c.type === 'cloud') {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.pow(Math.random(), 0.8) * size;
                tar[i * 3] = Math.cos(angle) * radius;
                tar[i * 3 + 1] = (Math.random() - 0.5) * size * 0.6;
                tar[i * 3 + 2] = Math.sin(angle) * radius;
            } else if (c.type === 'ring') {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() > 0.8 ? Math.random() * (size * 0.2) : size * 0.8;
                tar[i * 3] = Math.cos(angle) * radius;
                tar[i * 3 + 1] = (Math.random() - 0.5) * size * 0.1;
                tar[i * 3 + 2] = Math.sin(angle) * radius;
            } else if (c.type === 'elliptical') {
                const u = Math.random() * Math.PI * 2;
                const v = Math.acos(2 * Math.random() - 1);
                const r = Math.pow(Math.random(), 0.4) * size;
                tar[i * 3] = r * Math.sin(v) * Math.cos(u) * 1.5;
                tar[i * 3 + 1] = r * Math.sin(v) * Math.sin(u) * 0.4;
                tar[i * 3 + 2] = r * Math.cos(v) * 0.8;
            } else {
                const arms = c.arms || 3;
                const arm = i % arms;
                const angle = dist * (size * 0.3) + (arm * Math.PI * 2) / arms;
                tar[i * 3] = Math.cos(angle) * dist * size;
                tar[i * 3 + 1] = (Math.random() - 0.5) * size * 0.1;
                tar[i * 3 + 2] = Math.sin(angle) * dist * size;
            }

            dustCol[i * 3] = darkDust.r; dustCol[i * 3 + 1] = darkDust.g; dustCol[i * 3 + 2] = darkDust.b;
            const finalCol = color1.clone().lerp(color2, dist);
            starCol[i * 3] = finalCol.r; starCol[i * 3 + 1] = finalCol.g; starCol[i * 3 + 2] = finalCol.b;
            siz[i] = Math.pow(Math.random(), 4.0) * 8.0 + 0.3;
            off[i] = Math.random();
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(tar, 3));
        geo.setAttribute('aDustColor', new THREE.BufferAttribute(dustCol, 3));
        geo.setAttribute('aStarColor', new THREE.BufferAttribute(starCol, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(off, 1));

        return { geo, pos: c.pos, initialUniforms: { uTime: { value: 0 }, uProgress: { value: 0 }, uAudio: { value: 0 }, uOpacity: { value: 1.0 } } };
    });
}

export function GalaxyAct({ visible }: GalaxyActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();
  const systemsData = useMemo(() => generateGalaxySystems(GALAXY_CLUSTERS), []);
  
  const systemsRefs = useRef<THREE.ShaderMaterial[]>([]);

  const systems = useMemo(() => systemsData.map((data, idx) => ({
    geo: data.geo,
    pos: data.pos,
    material: (
      <shaderMaterial
        ref={(el) => { if (el) systemsRefs.current[idx] = el; }}
        attach="material"
        uniforms={data.initialUniforms}
        vertexShader={GALAXY_VS}
        fragmentShader={GALAXY_FS}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    )
  })), [systemsData]);

  useFrame((state) => {
    if (!visible) return;
    const time = state.clock.getElapsedTime();
    const progress = (scroll.offset - 0.1) * (1 / 0.15); 
    const clampedProgress = Math.max(0, Math.min(1.0, progress));

    systemsRefs.current.forEach(mat => {
      if (mat) {
        mat.uniforms.uTime.value = time;
        mat.uniforms.uProgress.value = clampedProgress;
      }
    });

    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.05;
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      {systems.map((sys, idx) => (
        <points key={idx} geometry={sys.geo} position={sys.pos as any}>
          {sys.material}
        </points>
      ))}
    </group>
  );
}
