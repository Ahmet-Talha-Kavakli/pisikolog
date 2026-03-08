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

        // 1. Crystal Core Shader (Iridescence)
        const coreVS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 wp = modelViewMatrix * vec4(position, 1.0); vV = normalize(-wp.xyz); gl_Position = projectionMatrix * wp; }`;
        const coreFS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; uniform float uTime; uniform float uAudio; void main() { float fr = pow(1.1 - dot(vV, vN), 3.0); vec3 prism = vec3(0.5, 0.7, 1.0) * (sin(vUv.y * 30.0 + uTime * 2.0) * 0.2 + 0.8); gl_FragColor = vec4(prism + vec3(0.8, 0.9, 1.0) * fr * (1.5 + uAudio * 3.0), 0.95); }`;
        this.coreMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uAudio: { value: 0 } }, vertexShader: coreVS, fragmentShader: coreFS, transparent: true });
        this.core = new THREE.Mesh(new THREE.OctahedronGeometry(4, 3), this.coreMat);
        this.group.add(this.core);

        // 2. God Rays
        this.rays = new THREE.Group();
        for (let i = 0; i < 32; i++) {
            const ray = new THREE.Mesh(new THREE.PlaneGeometry(3, 100), new THREE.MeshBasicMaterial({ color: 0x8899ff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
            ray.rotation.z = (i / 32) * 6.28;
            ray.position.z = -10;
            this.rays.add(ray);
        }
        this.group.add(this.rays);

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 100), new THREE.Vector3(20, 10, 50), new THREE.Vector3(-30, -10, 25), new THREE.Vector3(0, 0, 15)
        ]);

        this.initialized = true;
        this.active = true;
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
        this.core.rotation.y = time * 0.3 + aBoost * 2.0;
        this.rays.rotation.z = time * 0.1;

        if (this.cameraPath) {
            this.camera.position.copy(this.cameraPath.getPointAt(progress));
            this.camera.lookAt(0, 0, 0);
        }
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
