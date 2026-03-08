// ============================================
// ACT 5 — SATURN RING TOUR: THE ICY EXPANSE
// Instanced Icy Shards → Backlit Scattering → Cinematic Warp
// ============================================
import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

export class Act5_SaturnRing {
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

        // === 3D Instanced Icy Shards (Pixar Detail) ===
        const shardCount = 8000;
        const shardGeo = new THREE.IcosahedronGeometry(0.1, 0); // Low-poly shards
        this.shardMat = new THREE.MeshStandardMaterial({
            color: 0xddddff, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.8
        });
        this.shards = new THREE.InstancedMesh(shardGeo, this.shardMat, shardCount);

        const dummy = new THREE.Object3D();
        this._shardRadii = new Float32Array(shardCount);
        this._shardAngles = new Float32Array(shardCount);
        this._shardHeights = new Float32Array(shardCount);

        for (let i = 0; i < shardCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 12 + Math.random() * 8;
            const height = (Math.random() - 0.5) * 1.5;
            this._shardRadii[i] = radius;
            this._shardAngles[i] = angle;
            this._shardHeights[i] = height;

            dummy.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            dummy.scale.setScalar(0.2 + Math.random() * 0.5);
            dummy.updateMatrix();
            this.shards.setMatrixAt(i, dummy.matrix);
        }
        this.group.add(this.shards);

        // === Cinematic Warp Lines (Marvel/Star Wars feel) ===
        const lineCount = 1000;
        const lineGeo = new THREE.BufferGeometry();
        const linePos = new Float32Array(lineCount * 6); // 2 points per line
        for (let i = 0; i < lineCount; i++) {
            const i3 = i * 6;
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 15;
            const z = -Math.random() * 400;
            linePos[i3] = Math.cos(angle) * radius;
            linePos[i3 + 1] = Math.sin(angle) * radius;
            linePos[i3 + 2] = z;
            linePos[i3 + 3] = linePos[i3];
            linePos[i3 + 4] = linePos[i3 + 1];
            linePos[i3 + 5] = z + 10; // line length
        }
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        this.warpMat = new THREE.LineBasicMaterial({ color: 0x7c6fff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
        this.warpLines = new THREE.LineSegments(lineGeo, this.warpMat);
        this.group.add(this.warpLines);

        // Lights
        const sun = new THREE.DirectionalLight(0xfff5e0, 2);
        sun.position.set(50, 30, 30);
        this.group.add(sun);

        scene.add(this.group);
        this.initialized = true;
        this.active = true;
    }

    update(progress, time, delta, mouse) {
        if (!this.active || !this.initialized) return;

        const phase1 = Math.min(1.0, progress * 2.0); // Ring exploration
        const phase2 = Math.max(0, (progress - 0.5) * 2.0); // Warp acceleration

        if (progress < 0.5) {
            // EXPLORATION: Orbiting through shards
            const angle = time * 0.1 + progress * 10.0;
            this.camera.position.set(Math.cos(angle) * 16, 2, Math.sin(angle) * 16);
            this.camera.lookAt(0, 0, 0);
            this.shardMat.opacity = 0.8;
            this.warpMat.opacity = 0;
            this.camera.fov = 60;
        } else {
            // WARP DRIVE: Zooming into darkness
            const ease = phase2 * phase2 * phase2;
            this.camera.position.set(0, 0, 5);
            this.camera.lookAt(0, 0, -100);
            this.camera.fov = 60 + ease * 60;
            this.shardMat.opacity = Math.max(0, 0.8 - phase2 * 2.0);
            this.warpMat.opacity = Math.min(1, phase2 * 2.0);

            // Move warp lines
            const lPos = this.warpLines.geometry.attributes.position.array;
            const speed = 5 + ease * 50;
            for (let i = 0; i < lPos.length / 3; i++) {
                lPos[i * 3 + 2] += speed;
                if (lPos[i * 3 + 2] > 20) lPos[i * 3 + 2] = -400;
            }
            this.warpLines.geometry.attributes.position.needsUpdate = true;
        }
        this.camera.updateProjectionMatrix();

        if (mouse) {
            this.group.rotation.y = mouse.normalizedX * 0.05;
            this.group.rotation.x = mouse.normalizedY * 0.05;
        }
    }

    deactivate() {
        if (this.group.parent) this.group.parent.remove(this.group);
        this.active = false;
        if (this.camera) { this.camera.fov = 60; this.camera.updateProjectionMatrix(); }
    }

    dispose() {
        this.deactivate();
        this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); } });
    }
}
