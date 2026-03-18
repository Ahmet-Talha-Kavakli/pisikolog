// ============================================
// ACT 7 — LYRA REVEAL (SILENT V4.7)
// NO EXTERNAL HDR — Procedural Crystal Core
// ============================================
import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

export class Act10_LyraReveal {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._sfxPlayed = false;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 0, 15), fov: 60 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        // 1. Crystal Core Shader (Ultra Iridescence)
        const coreVS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 wp = modelViewMatrix * vec4(position, 1.0); vV = normalize(-wp.xyz); gl_Position = projectionMatrix * wp; }`;
        const coreFS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; uniform float uTime; uniform float uAudio; void main() { float fr = pow(1.1 - dot(vV, vN), 3.0); vec3 prism = vec3(0.6, 0.8, 1.0) * (sin(vUv.y * 40.0 + uTime * 3.0) * 0.15 + 0.85); vec3 irid = vec3(sin(uTime*0.5), cos(uTime*0.3), 1.0) * 0.2; gl_FragColor = vec4(prism + irid + vec3(0.9, 0.95, 1.0) * fr * (2.0 + uAudio * 5.0), 1.0); }`;
        this.coreMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uAudio: { value: 0 } }, vertexShader: coreVS, fragmentShader: coreFS, transparent: true });

        this.core = new THREE.Mesh(new THREE.OctahedronGeometry(5, 4), this.coreMat);
        this.group.add(this.core);

        // 2. Neural Bloom (Internal Glow Spheres)
        this.blooms = new THREE.Group();
        for (let i = 0; i < 5; i++) {
            const bloom = new THREE.Mesh(
                new THREE.SphereGeometry(2 + i, 32, 32),
                new THREE.MeshBasicMaterial({ color: 0x7c6fff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending })
            );
            this.blooms.add(bloom);
        }
        this.group.add(this.blooms);

        // 3. Multi-Layer God Rays
        this.rays = new THREE.Group();
        for (let i = 0; i < 48; i++) {
            const h = 80 + Math.random() * 40;
            const ray = new THREE.Mesh(
                new THREE.PlaneGeometry(2, h),
                new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
            );
            ray.rotation.z = (i / 48) * Math.PI * 2;
            ray.position.z = -20;
            this.rays.add(ray);
        }
        this.group.add(this.rays);

        // 4. Celestial Sparkles
        this._initSparkles();

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 80),
            new THREE.Vector3(40, 20, 60),
            new THREE.Vector3(-20, -10, 30),
            new THREE.Vector3(0, 0, 18)
        ]);

        this.initialized = true;
        this.active = true;
    }

    _initSparkles() {
        const count = 3000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const tex = createCircleTexture('#ffffff', 64);
        for (let i = 0; i < count; i++) {
            const r = 10 + Math.random() * 60;
            const th = Math.random() * Math.PI * 2;
            const ph = Math.random() * Math.PI;
            pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
            pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
            pos[i * 3 + 2] = r * Math.cos(ph);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.sparkles = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x7c6fff, size: 0.1, map: tex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
        }));
        this.group.add(this.sparkles);
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized) return;
        const aBoost = (audio || 0);

        if (progress > 0.1 && !this._sfxPlayed) {
            if (window.app && window.app.activeAct === 7 && window.app.activeAct === 7 && window.app.audio) window.app.audio.playSFX('ambient_lyra', { volume: 1.2 });
            this._sfxPlayed = true;
        }

        this.coreMat.uniforms.uTime.value = time;
        this.coreMat.uniforms.uAudio.value = aBoost;
        this.core.rotation.y = time * 0.4 + aBoost * 3.0;
        this.core.rotation.z = time * 0.2;

        this.rays.rotation.z = time * 0.05;
        this.sparkles.rotation.y = time * 0.02;

        // Animate Blooms
        this.blooms.children.forEach((b, i) => {
            const s = 1.0 + Math.sin(time * 2.0 + i) * 0.1 + aBoost * 0.5;
            b.scale.set(s, s, s);
        });

        if (this.cameraPath) {
            this.camera.position.copy(this.cameraPath.getPointAt(progress));
            this.camera.lookAt(0, 0, 0);
        }
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
