// ============================================
// ACT 2 — GALAXY FORMATION (SILENT V4.7)
// NO EXTERNAL HDR — Procedural Celestial Void
// ============================================
import * as THREE from 'three';

export class Act2_GalaxyFormation {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this.galaxySystems = [];
        this._warpSfx = false;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 0, 100), fov: 65 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        // 1. Core Galaxy Shaders (V4.7 Stability)
        const galaxyVS = `
            uniform float uTime; uniform float uProgress; attribute vec3 aTarget; attribute vec3 aColor; attribute float aSize; attribute float aOffset;
            varying vec3 vColor; varying float vAlpha;
            void main() {
                vColor = aColor;
                float p = clamp(uProgress * 1.5 - aOffset * 0.3, 0.0, 1.0);
                float ease = p * p * (3.0 - 2.0 * p);
                vec3 pos = mix(position, aTarget, ease);
                float ang = uTime * (0.04 + aOffset * 0.08);
                float c = cos(ang); float s = sin(ang);
                float tx = pos.x * c - pos.z * s; float tz = pos.x * s + pos.z * c;
                pos.x = tx; pos.z = tz;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = aSize * (750.0 / -mvPosition.z) * (1.0 + sin(uTime + aOffset * 100.0) * 0.1);
                vAlpha = smoothstep(0.0, 0.15, uProgress) * (0.7 + 0.3 * sin(uTime * 3.0 + aOffset * 60.0));
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        const galaxyFS = `
            uniform float uAudio; uniform float uSystemOpacity; varying vec3 vColor; varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
                float core = smoothstep(0.4, 0.05, d) * (1.8 + uAudio * 3.0);
                gl_FragColor = vec4(vColor * core, vAlpha * uSystemOpacity);
            }
        `;

        this._initBackgroundStars(galaxyVS, galaxyFS);

        const clusters = [
            { pos: [0, 0, -50], size: 35, count: 60000, arms: 4, col1: '#7c6fff', col2: '#ffffff' },
            { pos: [-150, 40, -250], size: 30, count: 40000, arms: 3, col1: '#ff8844', col2: '#ffcc88' }
        ];
        for (const c of clusters) {
            const sys = this._createGalaxySystem(c, galaxyVS, galaxyFS);
            sys.points.position.set(...c.pos);
            this.galaxySystems.push(sys);
            this.group.add(sys.points);
        }

        this._initWarpStreaks();

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 120), new THREE.Vector3(100, 30, -150), new THREE.Vector3(-100, -30, -500), new THREE.Vector3(0, 0, -1000)
        ]);

        this.initialized = true;
        this.active = true;
    }

    _createGalaxySystem(config, vs, fs) {
        const { size, count, arms, col1, col2 } = config;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const tar = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const off = new Float32Array(count);
        const color1 = new THREE.Color(col1), color2 = new THREE.Color(col2);
        for (let i = 0; i < count; i++) {
            const r = Math.pow(Math.random(), 0.9); const a = Math.random() * 6.28;
            pos[i * 3] = Math.cos(a) * r * size * 8; pos[i * 3 + 1] = (Math.random() - 0.5) * size * 6; pos[i * 3 + 2] = Math.sin(a) * r * size * 8;
            const arm = i % arms;
            const dist = Math.pow(Math.random(), 0.9);
            const angle = dist * 12.0 + (arm * 6.28) / arms;
            tar[i * 3] = Math.cos(angle) * dist * size + (Math.random() - 0.5) * size * 0.12;
            tar[i * 3 + 1] = (Math.random() - 0.5) * size * 0.06;
            tar[i * 3 + 2] = Math.sin(angle) * dist * size + (Math.random() - 0.5) * size * 0.12;
            const color = color1.clone().lerp(color2, dist); col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;
            siz[i] = 0.8 + Math.random() * 2.5; off[i] = Math.random();
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(tar, 3));
        geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(off, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uProgress: { value: 0 }, uAudio: { value: 0 }, uSystemOpacity: { value: 1.0 } },
            vertexShader: vs, fragmentShader: fs, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        return { points: new THREE.Points(geo, mat), material: mat };
    }

    _initBackgroundStars(vs, fs) {
        const count = 20000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const off = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const r = 600 + Math.random() * 600; const t = Math.random() * 6.28; const p = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(p) * Math.cos(t); pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t); pos[i * 3 + 2] = r * Math.cos(p);
            col[i * 3] = 0.9; col[i * 3 + 1] = 0.9; col[i * 3 + 2] = 1.0; siz[i] = 0.8 + Math.random() * 1.5; off[i] = Math.random();
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(off, 1));
        this.bg = new THREE.Points(geo, new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uProgress: { value: 1.0 }, uAudio: { value: 0 }, uSystemOpacity: { value: 0.5 } },
            vertexShader: vs, fragmentShader: fs, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        }));
        this.group.add(this.bg);
    }

    _initWarpStreaks() {
        const count = 5000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 600; pos[i * 3 + 1] = (Math.random() - 0.5) * 600; pos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
            siz[i] = 1.0 + Math.random() * 1.5;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        const warpVS = `
            uniform float uTime; uniform float uSpeed; attribute float aSize; varying float vA;
            void main() {
                vec3 p = position; 
                p.z = mod(p.z + uTime * uSpeed * 800.0, 2000.0) - 1000.0;
                vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
                gl_PointSize = aSize * 4.0 * (1.0 + uSpeed * 3.0);
                vA = smoothstep(1000.0, 700.0, abs(p.z));
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        const warpFS = `varying float vA; uniform float uOpacity; void main() {
            if (length(gl_PointCoord-0.5)>0.5) discard;
            gl_FragColor = vec4(0.9, 0.95, 1.0, vA * uOpacity);
        }`;
        this.warpMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uSpeed: { value: 0 }, uOpacity: { value: 0 } },
            vertexShader: warpVS, fragmentShader: warpFS, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.group.add(new THREE.Points(geo, this.warpMat));
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized || !this.cameraPath) return;
        const aBoost = (audio || 0);
        const p1 = Math.min(1.0, progress * 1.5);
        const p2 = Math.max(0, (progress - 0.6) * 2.5);

        if (p2 > 0.1 && !this._warpSfx) {
            if (window.app && window.app.activeAct === 2 && window.app.audio) window.app.audio.playSFX('ambient_space', { volume: 1.2 });
            this._warpSfx = true;
        }

        for (const sys of this.galaxySystems) {
            sys.material.uniforms.uProgress.value = p1; sys.material.uniforms.uTime.value = time;
            sys.material.uniforms.uAudio.value = aBoost; sys.material.uniforms.uSystemOpacity.value = 1.0 - p2;
            sys.points.rotation.y += delta * 0.15 * (1.0 + aBoost * 3.0);
        }

        this.bg.material.uniforms.uTime.value = time;
        this.bg.material.uniforms.uSystemOpacity.value = 0.5 * (1.0 - p2);

        this.warpMat.uniforms.uTime.value = time;
        this.warpMat.uniforms.uSpeed.value = 0.4 + p2 * 10.0 + aBoost * 5.0;
        this.warpMat.uniforms.uOpacity.value = p2 * 0.9;

        this.camera.position.copy(this.cameraPath.getPointAt(progress));
        this.camera.lookAt(0, 0, -200 - p2 * 800);
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
