// ============================================
// ACT 3 — SATURN (SILENT V4.7)
// NO EXTERNAL HDR — Procedural Gas Giant
// ============================================
import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

export class Act4_Saturn {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._sfxPlayed = false;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 5, 40), fov: 60 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        // 1. Saturn Core
        const planetGeo = new THREE.IcosahedronGeometry(12, 64);
        const planetVS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 wp = modelViewMatrix * vec4(position, 1.0); vV = normalize(-wp.xyz); gl_Position = projectionMatrix * wp; }`;
        const planetFS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; uniform float uTime; void main() { float fr = pow(1.1 - dot(vV, vN), 3.0); float bands = sin(vUv.y * 50.0 + sin(vUv.x * 5.0 + uTime * 0.1) * 2.0) * 0.05 + 0.5; vec3 col = mix(vec3(0.9, 0.8, 0.6), vec3(0.7, 0.6, 0.4), bands); gl_FragColor = vec4(col + vec3(0.2, 0.1, 0.3) * fr, 1.0); }`;
        this.planetMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, vertexShader: planetVS, fragmentShader: planetFS });
        this.planet = new THREE.Mesh(planetGeo, this.planetMat);
        this.group.add(this.planet);

        // 2. Rings
        const ringGeo = new THREE.RingGeometry(15, 28, 128);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x888877, side: THREE.DoubleSide, transparent: true, opacity: 0.7,
            roughness: 0.3, metalness: 0.5
        });
        this.rings = new THREE.Mesh(ringGeo, ringMat);
        this.rings.rotation.x = Math.PI / 2.5;
        this.group.add(this.rings);

        // 3. Ice Particles (60k)
        this._initIceParticles();

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 80, 200), new THREE.Vector3(100, 40, 50), new THREE.Vector3(-80, -20, 100), new THREE.Vector3(0, 5, 40)
        ]);

        this.initialized = true;
        this.active = true;
    }

    _initIceParticles() {
        const count = 60000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 15.5 + Math.random() * 12; const a = Math.random() * 6.28;
            pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2; pos[i * 3 + 2] = Math.sin(a) * r;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.icePoints = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xccffff, size: 0.05, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
        }));
        this.group.add(this.icePoints);
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized) return;
        const aBoost = (audio || 0);

        if (progress > 0.1 && !this._sfxPlayed) {
            if (window.app && window.app.activeAct === 3 && window.app.audio) window.app.audio.playSFX('ambient_saturn', { volume: 1.0 });
            this._sfxPlayed = true;
        }

        this.planetMat.uniforms.uTime.value = time;
        this.planet.rotation.y = time * 0.05;
        this.icePoints.rotation.y = time * 0.02;

        if (this.cameraPath) {
            this.camera.position.copy(this.cameraPath.getPointAt(progress));
            this.camera.lookAt(0, 0, 0);
        }
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
