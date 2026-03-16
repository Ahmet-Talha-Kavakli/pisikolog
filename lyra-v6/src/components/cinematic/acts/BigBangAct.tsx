'use client';

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, useScroll } from '@react-three/drei';
import { createCircleTexture } from '@/lib/SpriteUtils';

interface BigBangActProps {
  visible: boolean;
}

const PLASMA_COUNT = 400000;

function generatePlasmaPositions(count: number) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const th = 2 * Math.PI * u;
    const ph = Math.acos(2 * v - 1);
    pos[i * 3] = Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = Math.cos(ph);
  }
  return pos;
}

export function BigBangAct({ visible }: BigBangActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const singularityRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.ShaderMaterial>(null);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null);
  const plasmaMatRef = useRef<THREE.ShaderMaterial>(null);
  
  const scroll = useScroll();

  const circleTex = useMemo(() => createCircleTexture('#ffffff', 256), []);
  const starTex = useTexture('/textures/8k_stars_milky_way.jpg');

  const coreMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1.0 } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform float uTime;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position * (1.0 + sin(uTime * 5.0) * 0.015), 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }
      float fbm(vec3 p) {
        float v = 0.0; float a = 0.5; vec3 shift = vec3(100);
        for (int i = 0; i < 4; ++i) { v += a * snoise(p); p = p * 2.0 + shift; a *= 0.5; }
        return v;
      }
      void main() {
        vec3 viewDir = normalize(vViewPosition);                 
        float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.5);
        vec3 noisePos = vec3(vNormal * 4.0) + vec3(uTime * 0.5, uTime * 0.2, -uTime * 0.8);
        float noiseVal = fbm(noisePos) * 0.5 + 0.5;
        float edgeGlow = smoothstep(0.3, 1.0, fresnel * noiseVal * 1.5);
        float pureEdge = smoothstep(0.7, 1.0, fresnel);
        vec3 coreColor = vec3(0.01, 0.0, 0.03); 
        vec3 rimColor = vec3(0.8, 0.9, 1.0) * (uIntensity * 1.5); 
        vec3 brightRimColor = vec3(1.0, 1.0, 1.0) * (uIntensity * 2.0); 
        vec3 color = mix(coreColor, rimColor, edgeGlow);
        color = mix(color, brightRimColor, pureEdge);
        float innerPulse = snoise(vec3(vNormal * 4.0, uTime)) * 0.5 + 0.5;
        color += coreColor * innerPulse * 2.0;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: true,
  }), []);

  const haloMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uIntensity: { value: 1.0 }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uIntensity; uniform float uTime; varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5);
        float glow = exp(-d * 8.0) * 1.5;
        float noiseDistortion = sin(vUv.x * 20.0 + uTime) * cos(vUv.y * 20.0 - uTime) * 0.05;
        float finalDist = d + noiseDistortion;
        float outerAura = smoothstep(0.5, 0.1, finalDist) * 0.5;
        vec3 color = mix(vec3(0.5, 0.7, 1.0), vec3(1.0, 1.0, 1.0), glow);
        float alpha = (glow + outerAura) * uIntensity;
        gl_FragColor = vec4(color * alpha, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  const plasmaPositions = useMemo(() => generatePlasmaPositions(PLASMA_COUNT), []);

  const plasmaMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uExpansion: { value: 0 }, uCooling: { value: 0 }, uMap: { value: circleTex } },
    vertexShader: `
      uniform float uTime; uniform float uExpansion; uniform float uCooling;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float expPow = pow(uExpansion, 0.7);
        vec3 pos = position * expPow * 1200.0;
        vec3 tWhite = vec3(1.0, 1.0, 1.0);
        vec3 tDimWhite = vec3(0.8, 0.9, 1.0); 
        vec3 color = mix(tWhite, tDimWhite, uCooling);
        vColor = color * (1.5 + (1.0 - uCooling) * 5.0);
        vAlpha = smoothstep(1.0, 0.0, expPow);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (4.0 + fract(position.x * 1000.0) * 15.0) * (1.0 - uCooling * 0.6) * (1000.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap; varying vec3 vColor; varying float vAlpha;
      void main() { 
        vec4 tex = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha); 
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [circleTex]);

  useFrame((state) => {
    if (!visible) return;
    const time = state.clock.getElapsedTime();
    const progress = scroll.offset; 
    const actProgress = Math.min(1.0, progress / 0.125); 

    if (coreMatRef.current) {
      coreMatRef.current.uniforms.uTime.value = time;
      if (actProgress < 0.8) {
        const intensity = 1.0 + Math.pow(actProgress * 1.25, 12.0) * 25.0;
        coreMatRef.current.uniforms.uIntensity.value = intensity;
      }
    }

    if (haloMatRef.current) {
      haloMatRef.current.uniforms.uTime.value = time;
      if (actProgress < 0.8) {
        const intensity = 1.0 + Math.pow(actProgress * 1.25, 12.0) * 25.0;
        haloMatRef.current.uniforms.uIntensity.value = intensity;
      }
    }

    if (plasmaMatRef.current) {
      plasmaMatRef.current.uniforms.uTime.value = time;
      if (actProgress >= 0.8) {
        const expansion = (actProgress - 0.8) * 5.0;
        plasmaMatRef.current.uniforms.uExpansion.value = expansion;
        plasmaMatRef.current.uniforms.uCooling.value = Math.pow(expansion, 0.6);
      }
    }

    if (singularityRef.current && actProgress < 0.8) {
      singularityRef.current.scale.setScalar(1 + Math.pow(actProgress * 1.25, 8) * 5);
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      <mesh ref={singularityRef} material={coreMat} scale={[3, 3, 3]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial ref={coreMatRef} attach="material" {...coreMat} />
      </mesh>

      <mesh scale={[300, 300, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={haloMatRef} attach="material" {...haloMat} />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PLASMA_COUNT}
            array={plasmaPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial ref={plasmaMatRef} attach="material" {...plasmaMat} />
      </points>

      <mesh scale={[2500, 2500, 2500]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial map={starTex} side={THREE.BackSide} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
