// ============================================
// ACT 3 — MILKY WAY JOURNEY: THE WARP DRIVE
// GPU Warp Stars → Volumetric Nebulas → Core Rays
// ============================================
import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

export class Act3_MilkyWayJourney {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;
        const circleTex = createCircleTexture('#ffffff', 64);

        // === GPU Warp Star Shader (Cinematic Stretch) ===
        const warpVS = `
            uniform float uTime;
            uniform float uSpeed;
            attribute float aOffset;
            varying float vOpacity;
            void main() {
                vec3 pos = position;
                // Loop Z position for infinite warp
                float z = mod(pos.z + uTime * uSpeed * 200.0, 400.0) - 200.0;
                
                // Stretch based on speed (Marx/Pixar Warp feel)
                float stretch = 1.0 + uSpeed * 5.0;
                vec4 mvPosition = modelViewMatrix * vec4(pos.x, pos.y, z, 1.0);
                
                // Distant stars are smaller
                gl_PointSize = (1.5 + uSpeed * 5.0) * (300.0 / -mvPosition.z);
                vOpacity = smoothstep(-200.0, -150.0, z) * smoothstep(10.0, -50.0, z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        const warpFS = `
            uniform sampler2D uMap;
            varying float vOpacity;
            void main() {
                vec4 tex = texture2D(uMap, gl_PointCoord);
                gl_FragColor = vec4(vec3(1.0), tex.a * vOpacity);
            }
        `;

        const warpCount = 5000;
        const warpGeo = new THREE.BufferGeometry();
        const warpPos = new Float32Array(warpCount * 3);
        for (let i = 0; i < warpCount; i++) {
            const i3 = i * 3;
            warpPos[i3] = (Math.random() - 0.5) * 100;
            warpPos[i3 + 1] = (Math.random() - 0.5) * 100;
            warpPos[i3 + 2] = -Math.random() * 400;
        }
        warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPos, 3));
        this.warpMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uSpeed: { value: 0 }, uMap: { value: circleTex } },
            vertexShader: warpVS, fragmentShader: warpFS, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.warpStars = new THREE.Points(warpGeo, this.warpMat);
        this.group.add(this.warpStars);

        // === High-Detail Milky Way (30k particles) ===
        this._initMilkyWay(circleTex);

        // === Volumetric Nebula Clouds ===
        this._initNebulas();

        scene.add(this.group);
        this.initialized = true;
        this.active = true;
    }

    _initMilkyWay(tex) {
        const count = 40000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const arms = 4;
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const arm = Math.floor(Math.random() * arms);
            const t = Math.pow(Math.random(), 0.6);
            const r = t * 100;
            const angle = t * 10.0 + (arm * Math.PI * 2) / arms;
            const spread = 2.0 + t * 8.0;
            pos[i3] = Math.cos(angle) * r + (Math.random() - 0.5) * spread;
            pos[i3 + 1] = (Math.random() - 0.5) * spread * 0.2;
            pos[i3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * spread - 300;
            const c = new THREE.Color().setHSL(0.6 + (1 - t) * 0.4, 0.5, 0.6 + Math.random() * 0.4);
            col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        this.mw = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.8, map: tex, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        this.group.add(this.mw);
    }

    _initNebulas() {
        // GPU-style sprites for high-end nebula effect
        this.nebulas = new THREE.Group();
        for (let i = 0; i < 10; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d');
            const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            const h = Math.random() * 60 + 200;
            g.addColorStop(0, `hsla(${h}, 80%, 50%, 0.1)`);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), blending: THREE.AdditiveBlending, transparent: true, opacity: 0 }));
            sprite.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100, -50 - Math.random() * 250);
            sprite.scale.setScalar(20 + Math.random() * 40);
            this.nebulas.add(sprite);
        }
        this.group.add(this.nebulas);
    }

    update(progress, time, delta, mouse) {
        if (!this.active || !this.initialized) return;
        this.warpMat.uniforms.uTime.value = time;
        this.warpMat.uniforms.uSpeed.value = 0.5 + progress * 2.5;

        const mwAppear = Math.max(0, (progress - 0.2) * 1.25);
        this.mw.material.opacity = mwAppear;
        this.mw.rotation.y = time * 0.03;

        this.nebulas.children.forEach(n => {
            n.material.opacity = mwAppear * 0.4;
            n.position.z += (0.5 + progress * 2.0);
            if (n.position.z > 50) n.position.z = -300;
        });

        this.camera.position.z = 50 - progress * 250;
        this.camera.lookAt(0, 0, -350);

        if (mouse) {
            this.group.rotation.x = mouse.normalizedY * 0.05;
            this.group.rotation.y = mouse.normalizedX * 0.05;
        }
    }

    deactivate() {
        if (this.group.parent) this.group.parent.remove(this.group);
        this.active = false;
    }

    dispose() {
        this.deactivate();
        this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); } });
    }
}
