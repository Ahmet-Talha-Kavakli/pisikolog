// ============================================
// ACT 5 — ISTANBUL (SILENT V4.7)
// NO EXTERNAL HDR — Procedural Skyline Core
// ============================================
import * as THREE from 'three';

export class Act7_Istanbul {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._sfxPlayed = false;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 10, 50), fov: 60 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        // 1. Water Core (Bosphorus)
        const waterGeo = new THREE.PlaneGeometry(200, 200);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x070b14, roughness: 0.1, metalness: 0.8,
            transparent: true, opacity: 0.9
        });
        this.water = new THREE.Mesh(waterGeo, waterMat);
        this.water.rotation.x = -Math.PI / 2;
        this.group.add(this.water);

        // 2. Bosphorus Bridge (Procedural)
        const bridge = new THREE.Group();
        const road = new THREE.Mesh(new THREE.BoxGeometry(100, 1, 6), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        bridge.add(road);

        const towerGeo = new THREE.BoxGeometry(2, 40, 2);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const t1 = new THREE.Mesh(towerGeo, towerMat); t1.position.set(-30, 20, 0); bridge.add(t1);
        const t2 = new THREE.Mesh(towerGeo, towerMat); t2.position.set(30, 20, 0); bridge.add(t2);

        bridge.position.set(0, 5, 20);
        this.group.add(bridge);

        // 2. City Buildings (Instanced)
        this._initCity();

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(100, 40, 100),
            new THREE.Vector3(0, 15, 60), // Above the bridge
            new THREE.Vector3(-10, 10, 30) // Close to the city entrance
        ]);

        this.initialized = true;
        this.active = true;
    }

    _initCity() {
        const count = 3000;
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const buildVS = `
            attribute vec3 aColor; varying vec3 vColor; varying float vY;
            void main() {
                vColor = aColor;
                vY = position.y + 0.5;
                gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            }
        `;
        const buildFS = `
            uniform float uTime; varying vec3 vColor; varying float vY;
            void main() {
                float flick = step(0.9, sin(gl_FragCoord.y * 0.1 + uTime * 2.0)) * 0.2;
                gl_FragColor = vec4(vColor * (0.8 + flick + vY * 2.5), 1.0);
            }
        `;
        this.buildMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: buildVS, fragmentShader: buildFS
        });
        this.cityMesh = new THREE.InstancedMesh(boxGeo, this.buildMat, count);
        const m = new THREE.Matrix4();
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 180; const z = (Math.random() - 0.5) * 180;
            const h = 5 + Math.random() * 25;
            m.set(1, 0, 0, x, 0, h, 0, h / 2, 0, 0, 1, z, 0, 0, 0, 1);
            this.cityMesh.setMatrixAt(i, m);
            colors[i * 3] = 0.1 + Math.random() * 0.1; colors[i * 3 + 1] = 0.1 + Math.random() * 0.1; colors[i * 3 + 2] = 0.2 + Math.random() * 0.2;
        }
        this.cityMesh.instanceMatrix.needsUpdate = true;
        this.cityMesh.geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));
        this.group.add(this.cityMesh);
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized) return;
        const aBoost = (audio || 0);

        if (progress > 0.1 && !this._sfxPlayed) {
            if (window.app && window.app.activeAct === 5 && window.app.activeAct === 5 && window.app.audio) window.app.audio.playSFX('ambient_city', { volume: 0.8 });
            this._sfxPlayed = true;
        }

        this.buildMat.uniforms.uTime.value = time;
        this.group.rotation.y = time * 0.02;

        if (this.cameraPath) {
            this.camera.position.copy(this.cameraPath.getPointAt(progress));
            this.camera.lookAt(0, 0, 0);
        }
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
