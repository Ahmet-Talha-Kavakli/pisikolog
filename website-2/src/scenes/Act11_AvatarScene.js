import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Act11_AvatarScene {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this.avatar = null;
        this.mixer = null;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 1.6, 3), fov: 45 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        // 1. Lighting (Soft Studio Setup)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.group.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 2);
        spotLight.position.set(5, 5, 5);
        spotLight.castShadow = true;
        this.group.add(spotLight);

        // 2. Load Avatar
        const loader = new GLTFLoader();
        try {
            const gltf = await new Promise((resolve, reject) => {
                loader.load('/models/avatar.glb', resolve, undefined, reject);
            });
            this.avatar = gltf.scene;
            this.avatar.position.y = 0;
            this.group.add(this.avatar);

            // Setup shadows
            this.avatar.traverse(n => {
                if (n.isMesh) {
                    n.castShadow = true;
                    n.receiveShadow = true;
                }
            });

            // Setup Animation Mixer
            if (gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.avatar);
                const idle = this.mixer.clipAction(gltf.animations[0]);
                idle.play();
            }
        } catch (e) {
            console.warn("Avatar model not found at /models/avatar.glb. Showing placeholder.");
            this._createPlaceholder();
        }

        this.initialized = true;
        this.active = true;
    }

    _createPlaceholder() {
        const geo = new THREE.SphereGeometry(0.5, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0x7c6fff, metalness: 0.5, roughness: 0.2 });
        this.placeholder = new THREE.Mesh(geo, mat);
        this.placeholder.position.y = 1.6;
        this.group.add(this.placeholder);
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized) return;

        const aBoost = (audio || 0);

        // 1. Animation Mixer Update
        if (this.mixer) this.mixer.update(delta);

        // 2. Lip Sync (Morph Targets)
        if (this.avatar) {
            this.avatar.traverse(node => {
                if (node.isMesh && node.morphTargetInfluences) {
                    // Try to find standard Visemes or JawOpen
                    const jawOpenIdx = node.morphTargetDictionary ?
                        (node.morphTargetDictionary['jawOpen'] || node.morphTargetDictionary['mouthOpen']) : -1;

                    if (jawOpenIdx !== -1) {
                        // Smoothly lerp towards the audio level
                        node.morphTargetInfluences[jawOpenIdx] = THREE.MathUtils.lerp(
                            node.morphTargetInfluences[jawOpenIdx],
                            aBoost * 2.5, // Sensitivity
                            0.2
                        );
                    }
                }
            });
        }

        // 3. Placeholder Animation (if model missing)
        if (this.placeholder) {
            const s = 1.0 + aBoost * 0.5;
            this.placeholder.scale.set(s, s, s);
            this.placeholder.rotation.y += 0.01;
        }

        // Camera Follow Mouse (Subtle)
        if (mouse) {
            this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, mouse.x * 0.5, 0.05);
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 1.6 + mouse.y * 0.2, 0.05);
            this.camera.lookAt(0, 1.6, 0);
        }
    }

    deactivate() { this.active = false; }
    dispose() {
        this.group.traverse(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
            }
        });
    }
}
