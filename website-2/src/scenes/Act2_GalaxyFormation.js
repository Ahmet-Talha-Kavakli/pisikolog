// ============================================
// ACT 2 — GALAXY FORMATION (GOD-TIER V5.2)
// Coalescence of Matter → Deep Space Traveler
// ============================================
import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

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
        const circleTex = createCircleTexture('#ffffff', 64);

        // 1. Core Galaxy Shaders (Ultra Density)
        const galaxyVS = `
            uniform float uTime; uniform float uProgress; uniform float uAudio;
            attribute vec3 aTarget; attribute vec3 aColor; attribute float aSize; attribute float aOffset;
            varying vec3 vColor; varying float vAlpha;
            void main() {
                vColor = aColor;
                float p = clamp(uProgress * 1.3 - aOffset * 0.2, 0.0, 1.0);
                float ease = p * p * (3.0 - 2.0 * p);
                vec3 pos = mix(position, aTarget, ease);
                
                // Spiral rotation
                float ang = uTime * (0.02 + aOffset * 0.05) + uAudio * 2.0;
                float c = cos(ang); float s = sin(ang);
                float tx = pos.x * c - pos.z * s; float tz = pos.x * s + pos.z * c;
                pos.x = tx; pos.z = tz;

                vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = aSize * (800.0 / -mv.z) * (1.0 + sin(uTime + aOffset * 10.0) * 0.1);
                vAlpha = smoothstep(0.0, 0.1, uProgress) * (0.8 + 0.2 * sin(uTime * 2.0 + aOffset * 50.0));
                gl_Position = projectionMatrix * mv;
            }
        `;
        const galaxyFS = `
            uniform float uAudio; uniform float uOpacity; varying vec3 vColor; varying float vAlpha;
            void main() {
                float dist = length(gl_PointCoord - 0.5);
                if (dist > 0.5) discard;
                float core = smoothstep(0.5, 0.0, dist) * (2.0 + uAudio * 4.0);
                gl_FragColor = vec4(vColor * core, vAlpha * uOpacity);
            }
        `;

        // 2. Background Star Field
        this._initDeepStars(galaxyVS, galaxyFS);

        // 3. Spiral Galaxy Clusters
        const clusters = [
            { pos: [0, 0, -100], size: 40, count: 70000, arms: 4, col1: '#7c6fff', col2: '#ffffff' },
            { pos: [-180, 50, -300], size: 30, count: 40000, arms: 3, col1: '#ff8844', col2: '#ffcc88' },
            { pos: [200, -60, -500], size: 35, count: 45000, arms: 5, col1: '#44ffcc', col2: '#ffffff' }
        ];

        for (const c of clusters) {
            const sys = this._createGalaxyCluster(c, galaxyVS, galaxyFS);
            sys.points.position.set(...c.pos);
            this.galaxySystems.push(sys);
            this.group.add(sys.points);
        }

        // 4. Warp Streaks (Deep Space Travel)
        this._initStarStreaks();

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 150),
            new THREE.Vector3(120, 40, -100),
            new THREE.Vector3(-150, -30, -400),
            new THREE.Vector3(0, 0, -1000)
        ]);

        this.initialized = true;
        this.active = true;
    }

    _createGalaxyCluster(config, vs, fs) {
        const { size, count, arms, col1, col2 } = config;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const tar = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const off = new Float32Array(count);
        const color1 = new THREE.Color(col1), color2 = new THREE.Color(col2);

        for (let i = 0; i < count; i++) {
            // Chaotic Initial State
            const rInit = Math.pow(Math.random(), 0.5) * size * 10;
            const aInit = Math.random() * Math.PI * 2;
            pos[i * 3] = Math.cos(aInit) * rInit;
            pos[i * 3 + 1] = (Math.random() - 0.5) * size * 5;
            pos[i * 3 + 2] = Math.sin(aInit) * rInit;

            // Spiral Target State
            const arm = i % arms;
            const dist = Math.pow(Math.random(), 0.9);
            const angle = dist * (size * 0.3) + (arm * Math.PI * 2) / arms;
            tar[i * 3] = Math.cos(angle) * dist * size + (Math.random() - 0.5) * size * 0.2;
            tar[i * 3 + 1] = (Math.random() - 0.5) * size * 0.1;
            tar[i * 3 + 2] = Math.sin(angle) * dist * size + (Math.random() - 0.5) * size * 0.2;

            const finalCol = color1.clone().lerp(color2, dist);
            col[i * 3] = finalCol.r; col[i * 3 + 1] = finalCol.g; col[i * 3 + 2] = finalCol.b;
            siz[i] = 1.0 + Math.random() * 2.5;
            off[i] = Math.random();
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(tar, 3));
        geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(off, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uProgress: { value: 0 }, uAudio: { value: 0 }, uOpacity: { value: 1.0 } },
            vertexShader: vs, fragmentShader: fs, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        return { points: new THREE.Points(geo, mat), material: mat };
    }

    _initDeepStars(vs, fs) {
        const count = 30000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const off = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const r = 800 + Math.random() * 800;
            const t = Math.random() * 6.28;
            const p = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(p) * Math.cos(t);
            pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
            pos[i * 3 + 2] = r * Math.cos(p);
            col[i * 3] = 0.8; col[i * 3 + 1] = 0.8; col[i * 3 + 2] = 1.0;
            siz[i] = 1.0 + Math.random() * 2.0; off[i] = Math.random();
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(off, 1));

        this.bg = new THREE.Points(geo, new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uProgress: { value: 1.0 }, uAudio: { value: 0 }, uOpacity: { value: 0.4 } },
            vertexShader: vs, fragmentShader: fs, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        }));
        this.group.add(this.bg);
    }

    _initStarStreaks() {
        const count = 8000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 1000;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 1000;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 3000;
            siz[i] = 1.0 + Math.random() * 2.5;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));

        this.warpMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uSpeed: { value: 0 }, uOpacity: { value: 0 } },
            vertexShader: `
                uniform float uTime; uniform float uSpeed; attribute float aSize; varying float vAlpha;
                void main() {
                    vec3 p = position; 
                    p.z = mod(p.z + uTime * uSpeed * 1000.0, 3000.0) - 1500.0;
                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    gl_PointSize = aSize * (2.0 + uSpeed * 5.0) * (600.0 / -mv.z);
                    vAlpha = smoothstep(1500.0, 1000.0, abs(p.z));
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                varying float vAlpha; uniform float uOpacity;
                void main() {
                    if (length(gl_PointCoord-0.5)>0.5) discard;
                    gl_FragColor = vec4(0.8, 0.9, 1.0, vAlpha * uOpacity);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.group.add(new THREE.Points(geo, this.warpMat));
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized || !this.cameraPath) return;
        const aBoost = (audio || 0);

        const pCoalescence = Math.min(1.0, progress * 1.6);
        const pWarp = Math.max(0, (progress - 0.7) * 3.33);

        if (pWarp > 0.1 && !this._warpSfx) {
            if (window.app && window.app.audio) window.app.audio.playSFX('ambient_space', { volume: 1.5 });
            this._warpSfx = true;
        }

        for (const sys of this.galaxySystems) {
            sys.material.uniforms.uProgress.value = pCoalescence;
            sys.material.uniforms.uTime.value = time;
            sys.material.uniforms.uAudio.value = aBoost;
            sys.material.uniforms.uOpacity.value = 1.0 - pWarp;
            sys.points.rotation.y += delta * 0.2 * (1.0 + aBoost * 2.0);
        }

        this.bg.material.uniforms.uTime.value = time;
        this.bg.material.uniforms.uOpacity.value = 0.4 * (1.0 - pWarp);

        this.warpMat.uniforms.uTime.value = time;
        this.warpMat.uniforms.uSpeed.value = 0.5 + pWarp * 15.0 + aBoost * 5.0;
        this.warpMat.uniforms.uOpacity.value = pWarp * 1.0;

        // Smooth Camera Follow
        this.camera.position.copy(this.cameraPath.getPointAt(progress));
        this.camera.lookAt(0, 0, -500 - pWarp * 1500);

        // Interaction
        this.group.rotation.x = mouse.normalizedY * 0.05;
        this.group.rotation.y = mouse.normalizedX * 0.05;
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
