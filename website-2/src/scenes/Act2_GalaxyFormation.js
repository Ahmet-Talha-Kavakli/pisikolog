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

        // 1. Core Galaxy Shaders (Nebula to Sprial Transition)
        const galaxyVS = `
            uniform float uTime; uniform float uProgress; uniform float uAudio;
            attribute vec3 aTarget; attribute vec3 aDustColor; attribute vec3 aStarColor; attribute float aSize; attribute float aOffset;
            varying vec3 vColor; varying float vAlpha;
            void main() {
                // p represents how "collapsed" into a star this individual particle is
                float p = clamp(uProgress * 1.6 - aOffset * 0.4, 0.0, 1.0);
                float ease = p * p * (3.0 - 2.0 * p);
                
                // Pull from chaotic scattered dust to ordered spiral arms
                vec3 pos = mix(position, aTarget, ease);
                
                // Color transition from dim purple/grey dust to brilliant ignited star color
                vColor = mix(aDustColor, aStarColor, ease);
                
                // Spin: As they collapse, the vortex spins faster (conservation of angular momentum)
                float rotationSpeed = (0.01 + aOffset * 0.04) + (ease * 0.6) + uAudio * 2.0;
                float ang = uTime * rotationSpeed;
                float c = cos(ang); float s = sin(ang);
                float tx = pos.x * c - pos.z * s; float tz = pos.x * s + pos.z * c;
                pos.x = tx; pos.z = tz;

                vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                
                // Size: Dense dust shrinks into intense tiny stars
                gl_PointSize = (aSize * (1.5 - ease * 0.5)) * (800.0 / -mv.z) * (1.0 + sin(uTime + aOffset * 10.0) * (0.1 + ease * 0.2));
                vAlpha = smoothstep(0.0, 0.1, uProgress) * (0.6 + ease * 0.4 + 0.2 * sin(uTime * 2.0 + aOffset * 50.0));
                gl_Position = projectionMatrix * mv;
            }
        `;
        const galaxyFS = `
            uniform float uAudio; uniform float uOpacity; varying vec3 vColor; varying float vAlpha;
            void main() {
                float dist = length(gl_PointCoord - 0.5);
                if (dist > 0.5) discard;
                
                // Cinematic Glow Profile
                float core = exp(-dist * 10.0) * 3.0; // Intense super-hot center
                float halo = smoothstep(0.5, 0.0, dist); // Soft outer gas layer
                float brightness = (core + halo) * (1.0 + uAudio * 2.5);
                
                gl_FragColor = vec4(vColor * brightness, vAlpha * uOpacity);
            }
        `;

        // 2. Background Star Field
        this._initDeepStars(galaxyVS, galaxyFS);

        // 3. Spiral Galaxy Clusters - A massive expanded universe
        const clusters = [
            // The massive central/primary galaxy
            { pos: [0, 0, -100], size: 55, count: 80000, type: 'spiral', arms: 5, col1: '#7c6fff', col2: '#ffffff' },
            // Secondary mid-ground galaxies wrapping around our flight path
            { pos: [-160, 60, -300], size: 30, count: 40000, type: 'cloud', col1: '#ff8844', col2: '#ffcc88' },
            { pos: [190, -40, -450], size: 35, count: 45000, type: 'ring', col1: '#44ffcc', col2: '#ffffff' },
            // Distant deeper galaxies creating an immersive scale
            { pos: [-200, -120, -700], size: 25, count: 25000, type: 'elliptical', col1: '#ff44aa', col2: '#ffccff' },
            { pos: [300, 150, -900], size: 25, count: 30000, type: 'spiral', arms: 4, col1: '#44aaff', col2: '#ddffff' },
            { pos: [-150, 220, -1100], size: 20, count: 20000, type: 'cloud', col1: '#aa44ff', col2: '#eeddff' },
            { pos: [250, -180, -1350], size: 45, count: 40000, type: 'spiral', arms: 3, col1: '#ffaa44', col2: '#ffeecc' },
            { pos: [0, 80, -1700], size: 70, count: 60000, type: 'ring', col1: '#ffffff', col2: '#88ccff' }
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
            new THREE.Vector3(0, 40, 400),       // 0.0 - Start further back, watching the dust
            new THREE.Vector3(150, 100, 800),    // 0.1 - Pull way back to reveal the gargantuan scale
            new THREE.Vector3(-50, 60, 1100),    // 0.2 - Hang back in deep space, watching the ignition
            new THREE.Vector3(-150, 20, 950),    // 0.3 - Still observing, orbiting outside
            new THREE.Vector3(50, -50, 600),     // 0.4 - Spiral is fully formed now, plunging downwards
            new THREE.Vector3(120, 60, 100),     // 0.5 - Swooping WIDE past the central primary spiral (avoids blinding core)
            new THREE.Vector3(-80, -30, -150),   // 0.6 - Weave under the orange galaxy
            new THREE.Vector3(80, 50, -500),     // 0.7 - Weave over the cyan galaxy
            new THREE.Vector3(-100, -40, -900),  // 0.8 - Deeper into the cluster, dodging pink elliptical
            new THREE.Vector3(80, 80, -1500),    // 0.9 - Pass wide above the final gargantuan ring galaxy
            new THREE.Vector3(0, 0, -2000)       // 1.0 - Enter the warp immediately after the last galaxy
        ]);

        this.initialized = true;
        this.active = true;
    }

    _createGalaxyCluster(config, vs, fs) {
        const { size, count, arms, col1, col2 } = config;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const tar = new Float32Array(count * 3);
        const dustCol = new Float32Array(count * 3);
        const starCol = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const off = new Float32Array(count);

        const color1 = new THREE.Color(col1), color2 = new THREE.Color(col2);
        const darkDust = new THREE.Color(0x2a1b3d); // Deep purple cosmic dust
        const lightDust = new THREE.Color(0x3e3054); // Greyish purple cosmic gas

        for (let i = 0; i < count; i++) {
            // Chaotic Initial State (Massive, widely dispersed dust cloud)
            const rInit = Math.pow(Math.random(), 0.6) * size * 7; // Reduced spread so the camera escapes it easily
            const aInit = Math.random() * Math.PI * 2;
            pos[i * 3] = Math.cos(aInit) * rInit;
            pos[i * 3 + 1] = (Math.random() - 0.5) * size * 5;
            pos[i * 3 + 2] = Math.sin(aInit) * rInit;

            const dist = Math.pow(Math.random(), 0.9);

            // Target State (Distinct shapes based on type)
            if (config.type === 'cloud') {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.pow(Math.random(), 0.8) * size;
                tar[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * size * 0.8;
                tar[i * 3 + 1] = (Math.random() - 0.5) * size * 0.6; // puffy
                tar[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * size * 0.8;
            } else if (config.type === 'ring') {
                const angle = Math.random() * Math.PI * 2;
                const isCore = Math.random() > 0.8;
                const radius = isCore ? Math.random() * (size * 0.2) : size * 0.8 + Math.random() * (size * 0.2);
                tar[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * size * 0.1;
                tar[i * 3 + 1] = (Math.random() - 0.5) * size * (isCore ? 0.3 : 0.05);
                tar[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * size * 0.1;
            } else if (config.type === 'elliptical') {
                const u = Math.random() * Math.PI * 2;
                const v = Math.acos(2 * Math.random() - 1);
                const r = Math.pow(Math.random(), 0.4) * size;
                tar[i * 3] = r * Math.sin(v) * Math.cos(u) * 1.5; // stretched
                tar[i * 3 + 1] = r * Math.sin(v) * Math.sin(u) * 0.4; // flattened
                tar[i * 3 + 2] = r * Math.cos(v) * 0.8;
            } else { // spiral (default)
                const arms = config.arms || 3;
                const arm = i % arms;
                const angle = dist * (size * 0.3) + (arm * Math.PI * 2) / arms;
                tar[i * 3] = Math.cos(angle) * dist * size + (Math.random() - 0.5) * size * 0.2;
                tar[i * 3 + 1] = (Math.random() - 0.5) * size * (0.1 + (1.0 - dist) * 0.4);
                tar[i * 3 + 2] = Math.sin(angle) * dist * size + (Math.random() - 0.5) * size * 0.2;
            }

            // Dust Colors (Start State)
            const dColor = Math.random() > 0.6 ? darkDust : lightDust;
            dustCol[i * 3] = dColor.r; dustCol[i * 3 + 1] = dColor.g; dustCol[i * 3 + 2] = dColor.b;

            // Star Colors (End State)
            const finalCol = color1.clone().lerp(color2, dist);
            starCol[i * 3] = finalCol.r; starCol[i * 3 + 1] = finalCol.g; starCol[i * 3 + 2] = finalCol.b;

            // Extreme size variation: many tiny particles, a few massive glowing blobs
            siz[i] = Math.pow(Math.random(), 4.0) * 8.0 + 0.3;
            off[i] = Math.random();
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(tar, 3));
        geo.setAttribute('aDustColor', new THREE.BufferAttribute(dustCol, 3));
        geo.setAttribute('aStarColor', new THREE.BufferAttribute(starCol, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(off, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uProgress: { value: 0 }, uAudio: { value: 0 }, uOpacity: { value: 1.0 } },
            vertexShader: vs, fragmentShader: fs, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        return { points: new THREE.Points(geo, mat), material: mat };
    }

    _initDeepStars() {
        const count = 50000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const off = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const r = 1000 + Math.random() * 2000;
            const t = Math.random() * 6.28;
            const p = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(p) * Math.cos(t);
            pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
            pos[i * 3 + 2] = r * Math.cos(p);

            const c = (Math.random() > 0.8) ? new THREE.Color(0xffffff) :
                (Math.random() > 0.5 ? new THREE.Color(0xaaccff) : new THREE.Color(0xffeecc));
            col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
            siz[i] = 0.5 + Math.pow(Math.random(), 3.0) * 1.5; off[i] = Math.random();
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aStarColor', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('aDustColor', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(off, 1));

        const vs = `
            uniform float uTime; attribute float aSize; attribute vec3 aStarColor; varying vec3 vColor; varying float vTwinkle;
            void main() {
                vColor = aStarColor;
                vTwinkle = sin(uTime * 2.0 + aSize * 100.0) * 0.5 + 0.5;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = aSize * (800.0 / -mv.z);
                gl_Position = projectionMatrix * mv;
            }
        `;
        const fs = `
            varying vec3 vColor; varying float vTwinkle; uniform float uOpacity;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float core = exp(-d * 8.0);
                gl_FragColor = vec4(vColor * core * (0.8 + vTwinkle * 0.4), core * uOpacity);
            }
        `;

        this.bg = new THREE.Points(geo, new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.3 } },
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
            uniforms: { uTime: { value: 0 }, uSpeed: { value: 0 }, uOpacity: { value: 0 }, uCamZ: { value: 0 } },
            vertexShader: `
                uniform float uTime; uniform float uSpeed; uniform float uCamZ; attribute float aSize; varying float vAlpha;
                void main() {
                    vec3 p = position; 
                    float zOffset = mod(p.z + uTime * uSpeed * 3000.0, 4000.0); // Continual forward flow
                    p.z = uCamZ - zOffset + 1000.0; // Spans from +1000 (behind cam) to -3000 (way in front)
                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    gl_PointSize = aSize * (1.5 + uSpeed * 4.0) * (800.0 / -mv.z);
                    vAlpha = smoothstep(4000.0, 2500.0, zOffset) * smoothstep(0.0, 500.0, zOffset);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                varying float vAlpha; uniform float uOpacity; uniform float uSpeed;
                void main() {
                    float dist = length(gl_PointCoord-0.5);
                    if (dist > 0.5) discard;
                    
                    // The faster we go, the more it shifts to deep blue/cyan
                    vec3 colBase = vec3(0.8, 0.9, 1.0);
                    vec3 colWarp = vec3(0.4, 0.8, 1.0);
                    vec3 col = mix(colBase, colWarp, min(1.0, uSpeed / 10.0));
                    
                    float glow = exp(-dist * 6.0) * 1.5;
                    gl_FragColor = vec4(col * glow, vAlpha * uOpacity);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.group.add(new THREE.Points(geo, this.warpMat));
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized || !this.cameraPath) return;
        const aBoost = (audio || 0);

        // Core logic: Form earlier to view the galaxies, warp at the very end
        const pCoalescence = Math.min(1.0, progress * 1.3); // Slower formation to match the camera pullback
        const smoothCoal = pCoalescence * pCoalescence * (3.0 - 2.0 * pCoalescence); // Smooth organic easing
        const pWarp = Math.max(0, (progress - 0.70) * 3.33); // Start warp as we pass the last few galaxies so there is no dead space

        if (pWarp > 0.1 && !this._warpSfx) {
            if (window.app && window.app.audio) window.app.audio.playSFX('ambient_space', { volume: 1.5 });
            this._warpSfx = true;
        }

        // Majestic universal drift
        this.group.rotation.y = time * 0.015;
        this.group.rotation.x = Math.sin(time * 0.05) * 0.02;

        for (const sys of this.galaxySystems) {
            sys.material.uniforms.uProgress.value = smoothCoal;
            sys.material.uniforms.uTime.value = time;
            sys.material.uniforms.uAudio.value = aBoost;
            sys.material.uniforms.uOpacity.value = 1.0 - pWarp;
            sys.points.rotation.y += delta * 0.2 * (1.0 + aBoost * 2.0);
        }

        this.bg.material.uniforms.uTime.value = time;
        // Add subtle cosmic twinkle to background stars
        this.bg.material.uniforms.uOpacity.value = 0.4 * (1.0 - pWarp) * (0.8 + Math.sin(time * 3.0) * 0.2);

        this.warpMat.uniforms.uTime.value = time;
        this.warpMat.uniforms.uSpeed.value = 0.5 + pWarp * 15.0 + aBoost * 5.0;
        this.warpMat.uniforms.uOpacity.value = pWarp * 1.0;

        this.warpMat.uniforms.uOpacity.value = pWarp * 1.0;

        // Smooth Camera Follow: Dynamic looking during flight
        this.camera.position.copy(this.cameraPath.getPointAt(progress));
        this.warpMat.uniforms.uCamZ.value = this.camera.position.z; // Ensure warp wraps around the camera's current Z depth

        // As we progress, we look forward but with slight mouse influence, and finally look deep down the warp tunnel
        const lookT = Math.min(1.0, progress + 0.1);
        const futurePoint = this.cameraPath.getPointAt(lookT);
        this.camera.lookAt(futurePoint.x + mouse.normalizedX * 20.0, futurePoint.y + mouse.normalizedY * 20.0, futurePoint.z);

        // Interaction - add slight banking to the whole scene based on mouse
        this.group.rotation.x = mouse.normalizedY * 0.03;
        this.group.rotation.y = mouse.normalizedX * 0.03;
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
