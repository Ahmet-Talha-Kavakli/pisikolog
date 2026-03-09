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

        // 1. Urban Street Prototype
        const streetGeo = new THREE.PlaneGeometry(300, 300);
        const streetMat = new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 0.1, metalness: 0.8 });
        this.street = new THREE.Mesh(streetGeo, streetMat);
        this.street.rotation.x = -Math.PI / 2;
        this.group.add(this.street);

        // 2. Buildings & Details
        const buildGeo = new THREE.BoxGeometry(10, 50, 10);
        const buildMat = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.9 });

        for (let i = 0; i < 30; i++) {
            const building = new THREE.Mesh(buildGeo, buildMat);
            const side = i % 2 === 0 ? 30 + Math.random() * 10 : -30 - Math.random() * 10;
            building.position.set(side, 25, (i - 15) * 35);
            this.group.add(building);

            // Flickering Neon Signs (Procedural)
            if (Math.random() > 0.7) {
                const neon = new THREE.Mesh(
                    new THREE.BoxGeometry(0.2, 5, 3),
                    new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff0000, emissiveIntensity: 2 })
                );
                neon.position.set(side * 0.8, 15 + Math.random() * 10, (i - 15) * 35);
                this.group.add(neon);
            }

            // Streetlamps
            const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffaa }));
            lamp.position.set(side * 0.4, 15, (i - 15) * 35);
            this.group.add(lamp);

            const pLight = new THREE.PointLight(0xffaa00, 15, 30);
            pLight.position.copy(lamp.position);
            this.group.add(pLight);
        }

        // 3. Volumetric Fog Mist (Procedural)
        this._initMist();

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 10, 150),
            new THREE.Vector3(10, 12, 80),
            new THREE.Vector3(-15, 8, 30),
            new THREE.Vector3(-30, 15, 5)
        ]);

        this.initialized = true;
        this.active = true;
    }

    _initMist() {
        const count = 200;
        const geo = new THREE.BoxGeometry(20, 1, 20);
        const mat = new THREE.MeshStandardMaterial({ color: 0x112233, transparent: true, opacity: 0.05, depthWrite: false });
        for (let i = 0; i < count; i++) {
            const mist = new THREE.Mesh(geo, mat);
            mist.position.set((Math.random() - 0.5) * 100, Math.random() * 10, (Math.random() - 0.5) * 200);
            mist.rotation.y = Math.random() * Math.PI;
            this.group.add(mist);
        }
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
