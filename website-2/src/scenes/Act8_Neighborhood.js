// ============================================
// ACT 8 — NEIGHBORHOOD (SILENT V5.0)
// Procedural Urban Street & Building Approach
// ============================================
import * as THREE from 'three';

export class Act8_Neighborhood {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._sfxPlayed = false;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 5, 20), fov: 70 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        // 1. Urban Street Prototype (Dark Ground)
        const streetGeo = new THREE.PlaneGeometry(200, 200);
        const streetMat = new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 0.1, metalness: 0.8 });
        this.street = new THREE.Mesh(streetGeo, streetMat);
        this.street.rotation.x = -Math.PI / 2;
        this.group.add(this.street);

        // 2. Streetlamps & Buildings (Procedural)
        const buildGeo = new THREE.BoxGeometry(10, 40, 10);
        const buildMat = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.9 });

        for (let i = 0; i < 20; i++) {
            const building = new THREE.Mesh(buildGeo, buildMat);
            const side = i % 2 === 0 ? 30 : -30;
            building.position.set(side, 20, (i - 10) * 30);
            this.group.add(building);

            // Yellow Lamp (Glow Prototype)
            const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffaa }));
            lamp.position.set(side * 0.4, 15, (i - 10) * 30);
            this.group.add(lamp);

            const pLight = new THREE.PointLight(0xffaa00, 20, 30);
            pLight.position.copy(lamp.position);
            this.group.add(pLight);
        }

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 10, 150), new THREE.Vector3(10, 8, 80), new THREE.Vector3(-10, 5, 40), new THREE.Vector3(-25, 12, 10)
        ]);

        this.initialized = true;
        this.active = true;
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized) return;
        const aBoost = (audio || 0);

        if (progress > 0.1 && !this._sfxPlayed) {
            if (window.app && window.app.audio) window.app.audio.playSFX('ambient_neighborhood', { volume: 0.8 });
            this._sfxPlayed = true;
        }

        // Slight fog flicker (anxiety effect)
        this.street.material.opacity = 0.8 + Math.sin(time * 30.0) * 0.1 * aBoost;

        if (this.cameraPath) {
            this.camera.position.copy(this.cameraPath.getPointAt(progress));
            // Look toward the girl's apartment building window
            this.camera.lookAt(-30, 15, -10);
        }
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
