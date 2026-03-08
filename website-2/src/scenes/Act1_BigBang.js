// ============================================
// ACT 1 — BIG BANG (SILENT V4.7)
// No direct scene interaction. Pure context class.
// ============================================
import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

export class Act1_BigBang {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._sfxPlayed = false;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 0, 15), fov: 70 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        // 1. Procedural Starfield
        const starCount = 5000;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        const starSiz = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            const r = 200 + Math.random() * 800;
            const t = Math.random() * 6.28;
            const p = Math.acos(2 * Math.random() - 1);
            starPos[i * 3] = r * Math.sin(p) * Math.cos(t);
            starPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
            starPos[i * 3 + 2] = r * Math.cos(p);
            starSiz[i] = 1.0 + Math.random() * 3.0;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('size', new THREE.BufferAttribute(starSiz, 1));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, sizeAttenuation: true });
        this.stars = new THREE.Points(starGeo, starMat);
        this.group.add(this.stars);

        // 2. Singularity
        const singGeo = new THREE.IcosahedronGeometry(1.0, 128);
        const singVS = `
            uniform float uTime; uniform float uAudio;
            varying float vNoise; varying vec3 vNormal; varying vec3 vViewVec;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vViewVec = normalize(cameraPosition - wp.xyz);
                vNoise = sin(position.x * 2.5 + uTime * 1.5) * cos(position.y * 2.5 + uTime * 1.8);
                float dist = (0.25 + uAudio * 1.2) * vNoise;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * dist, 1.0);
            }
        `;
        const singFS = `
            uniform float uOpacity; uniform float uAudio;
            varying vec3 vNormal; varying vec3 vViewVec;
            void main() {
                float fr = pow(1.1 - abs(dot(vNormal, vViewVec)), 4.0);
                vec3 core = vec3(1.0, 0.98, 0.9);
                vec3 aura = vec3(1.0, 0.45, 0.15) * fr * (1.5 + uAudio * 4.0);
                gl_FragColor = vec4(core + aura, uOpacity);
            }
        `;
        this.singMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uAudio: { value: 0 }, uOpacity: { value: 0 } },
            vertexShader: singVS, fragmentShader: singFS, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.singularity = new THREE.Mesh(singGeo, this.singMat);
        this.group.add(this.singularity);

        const circleTex = createCircleTexture('#ffffff', 64);
        this._initExplosion(circleTex);

        this.initialized = true;
        this.active = true;
    }

    _initExplosion(tex) {
        const count = 100000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const vels = new Float32Array(count * 3);
        const palette = [new THREE.Color(0xffaa44), new THREE.Color(0xff4411), new THREE.Color(0x7c6fff)];
        for (let i = 0; i < count; i++) {
            const phi = Math.acos(1 - 2 * Math.random()); const theta = Math.random() * 6.28;
            const dx = Math.sin(phi) * Math.cos(theta); const dy = Math.sin(phi) * Math.sin(theta); const dz = Math.cos(phi);
            const s = 10.0 + Math.pow(Math.random(), 3.2) * 80.0;
            vels[i * 3] = dx * s; vels[i * 3 + 1] = dy * s; vels[i * 3 + 2] = dz * s;
            const c = palette[i % 3]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('aVelocity', new THREE.BufferAttribute(vels, 3));

        const partVS = `
            uniform float uProgress; uniform float uAudio;
            attribute vec3 aVelocity; varying vec3 vColor; varying float vAlpha;
            void main() {
                vColor = color;
                float p = max(0.0, (uProgress - 0.35) / 0.65);
                float exp = pow(p, 0.55) * 180.0;
                vec3 pos = aVelocity * exp;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = (1.2 + uAudio * 4.0) * (600.0 / -mvPosition.z);
                vAlpha = smoothstep(0.0, 0.08, p) * smoothstep(1.0, 0.85, p);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        const partFS = `
            uniform sampler2D uMap; varying vec3 vColor; varying float vAlpha;
            void main() {
                float tex = texture2D(uMap, gl_PointCoord).a; if (tex < 0.1) discard;
                gl_FragColor = vec4(vColor, vAlpha * tex * 0.95);
            }
        `;
        this.partMat = new THREE.ShaderMaterial({
            uniforms: { uProgress: { value: 0 }, uAudio: { value: 0 }, uMap: { value: tex } },
            vertexShader: partVS, fragmentShader: partFS, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.group.add(new THREE.Points(geo, this.partMat));
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized) return;
        const aBoost = (audio || 0);

        if (progress < 0.35) {
            const p = progress / 0.35;
            this.singMat.uniforms.uOpacity.value = Math.min(1.0, p * 4.0);
            this.singMat.uniforms.uTime.value = time;
            this.singMat.uniforms.uAudio.value = aBoost;
            const s = 1.0 + Math.pow(p, 6.5) * 25 + aBoost * 12;
            this.singularity.scale.setScalar(s);
            if (p > 0.98 && !this._sfxPlayed) {
                if (window.app && window.app.audio) window.app.audio.playSFX('ambient_bigbang', { volume: 1.5 });
                this._sfxPlayed = true;
            }
            this.camera.position.set(0, 0, 100).lerp(new THREE.Vector3(0, 0, 10), Math.pow(p, 0.5));
            this.camera.lookAt(0, 0, 0);
        } else {
            const pExp = (progress - 0.35) / 0.65;
            this.singMat.uniforms.uOpacity.value = Math.max(0, 1.0 - pExp * 12.0);
            this.partMat.uniforms.uProgress.value = progress;
            this.partMat.uniforms.uAudio.value = aBoost;
            if (pExp < 0.1) {
                const shake = (0.1 - pExp) * 50 * (1.0 + aBoost);
                this.camera.position.x += (Math.random() - 0.5) * shake;
                this.camera.position.y += (Math.random() - 0.5) * shake;
            }
        }
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
