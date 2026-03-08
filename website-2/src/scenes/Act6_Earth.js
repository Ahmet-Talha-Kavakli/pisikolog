// ============================================
// ACT 4 — EARTH (SILENT V4.7)
// NO EXTERNAL HDR — Procedural Atmospheric Core
// ============================================
import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

export class Act6_Earth {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._sfxPlayed = false;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 0, 30), fov: 55 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        // 1. Procedural Earth Core
        const earthGeo = new THREE.IcosahedronGeometry(10, 64);
        const earthVS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 wp = modelViewMatrix * vec4(position, 1.0); vV = normalize(-wp.xyz); gl_Position = projectionMatrix * wp; }`;
        const earthFS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; uniform float uTime; void main() { float fr = pow(1.1 - dot(vV, vN), 3.0); vec3 ocean = vec3(0.05, 0.1, 0.25); vec3 land = vec3(0.1, 0.2, 0.15); float m = sin(vUv.x * 20.0 + sin(vUv.y * 10.0)) * cos(vUv.y * 20.0) * 0.5 + 0.5; vec3 col = mix(ocean, land, smoothstep(0.4, 0.6, m)); gl_FragColor = vec4(col + vec3(0.4, 0.6, 1.0) * fr, 1.0); }`;
        this.earthMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, vertexShader: earthVS, fragmentShader: earthFS });
        this.earth = new THREE.Mesh(earthGeo, this.earthMat);
        this.group.add(this.earth);

        // 2. Re-entry Trails (6k)
        this._initTrails();

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 150),
            new THREE.Vector3(50, 20, 80),
            new THREE.Vector3(-10, 5, 45),
            new THREE.Vector3(3.5, 4.5, 20) // Zooming towards Turkey (approx coords on our sphere)
        ]);

        this.initialized = true;
        this.active = true;
    }

    _initTrails() {
        const count = 6000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vels = new Float32Array(count * 3);
        const offs = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const phi = Math.random() * 6.28; const theta = Math.random() * 6.28;
            const r = 10.5 + Math.random() * 80;
            pos[i * 3] = r * Math.sin(theta) * Math.cos(phi); pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi); pos[i * 3 + 2] = r * Math.cos(theta);
            vels[i * 3] = -pos[i * 3] * 0.2; vels[i * 3 + 1] = -pos[i * 3 + 1] * 0.2; vels[i * 3 + 2] = -pos[i * 3 + 2] * 0.2;
            offs[i] = Math.random();
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aVelocity', new THREE.BufferAttribute(vels, 3));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(offs, 1));
        const trailMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uProgress: { value: 0 } },
            vertexShader: `uniform float uTime; uniform float uProgress; attribute vec3 aVelocity; attribute float aOffset; void main() { vec3 p = position + aVelocity * uProgress; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (1.5 + sin(uTime + aOffset*100.0)) * (300.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
            fragmentShader: `void main() { gl_FragColor = vec4(1.0, 0.4, 0.1, 0.8); if (length(gl_PointCoord-0.5)>0.5) discard; }`,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.trails = new THREE.Points(geo, trailMat);
        this.group.add(this.trails);
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized) return;
        const aBoost = (audio || 0);

        if (progress > 0.1 && !this._sfxPlayed) {
            if (window.app && window.app.activeAct === 4 && window.app.audio) window.app.audio.playSFX('ambient_earth', { volume: 1.0 });
            this._sfxPlayed = true;
        }

        this.earthMat.uniforms.uTime.value = time;
        this.earth.rotation.y = time * 0.1;
        this.trails.material.uniforms.uProgress.value = progress;
        this.trails.material.uniforms.uTime.value = time;

        if (this.cameraPath) {
            this.camera.position.copy(this.cameraPath.getPointAt(progress));
            this.camera.lookAt(0, 0, 0);
        }
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
