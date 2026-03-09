// ============================================
// SCENE MANAGER — STABLE V5.0 (8-ACT ARCHITECTURE)
// Centralized Background & Visibility Management
// ============================================
import * as THREE from 'three';
import gsap from 'gsap';

export class SceneManager {
    constructor(scene, camera, renderer, audioManager) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.audioManager = audioManager;
        this.acts = {};
        this._isActivating = false;
        this.mouse = { normalizedX: 0, normalizedY: 0 };
        this._cameraTween = null;
        this.preloadedActs = new Set();
        this.activeAct = null;

        // Base BG Colors per Act (Safeguard)
        this.actBackgrounds = {
            1: 0x000000, 2: 0x000005, 3: 0x010105, 4: 0x020208,
            5: 0x050510, 6: 0x0a0a1a, 7: 0x05050a, 8: 0x080815
        };

        // 8-Act Narrative Progression (V5.0)
        this.actRanges = {
            1: [0.00, 0.15], // Big Bang
            2: [0.15, 0.28], // Galaxy
            3: [0.28, 0.40], // Saturn
            4: [0.40, 0.52], // Earth -> Turkey
            5: [0.52, 0.65], // Istanbul
            6: [0.65, 0.78], // Neighborhood
            7: [0.78, 0.90], // Home Interior (Negativity)
            8: [0.90, 1.00]  // Lyra Reveal (Hope)
        };

        this.actNames = {
            1: 'Kozmik Başlangıç', 2: 'Yıldızların Doğuşu', 3: 'Gezegenler Arası Yolculuk',
            4: 'Umut Küresi: Dünya', 5: 'Şehirlerin Işığı: İstanbul', 6: 'Bağlantı Kanalları',
            7: 'Karanlığın İçinde: Ev', 8: 'Lyra: Geleceğin Yankısı'
        };

        window.addEventListener('mousemove', (e) => {
            this.mouse.normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.normalizedY = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    registerAct(number, actInstance) {
        this.acts[number] = actInstance;
        if (actInstance.group) {
            actInstance.group.visible = false;
            this.scene.add(actInstance.group);
        }
    }

    getActForProgress(p) {
        for (const [act, [s, e]] of Object.entries(this.actRanges)) {
            if (p >= s && p < e) return parseInt(act);
        }
        return p <= 0 ? 1 : 8;
    }

    async activateAct(actNumber) {
        if (this.activeAct === actNumber || this._isActivating) return;
        this._isActivating = true;

        try {
            // Buffer: preload current + next
            const toPreload = [actNumber, actNumber + 1].filter(n => n >= 1 && n <= 8);
            for (const n of toPreload) {
                if (!this.preloadedActs.has(n) && this.acts[n]) {
                    await this.acts[n].init(this.scene, this.camera, this.renderer);
                    this.preloadedActs.add(n);
                }
            }

            this.activeAct = actNumber;

            // SENTINEL VISIBILITY & BACKGROUND CONTROL
            for (const [num, act] of Object.entries(this.acts)) {
                const n = parseInt(num);
                const isActive = (n === actNumber);
                if (act.group) act.group.visible = isActive;

                if (isActive) {
                    const bgColor = this.actBackgrounds[n] || 0x000000;
                    this.scene.background = new THREE.Color(bgColor);
                    if (act._env) this.scene.background = act._env;
                }
            }

            if (this.acts[actNumber] && this.acts[actNumber].getCameraTarget) {
                const t = this.acts[actNumber].getCameraTarget();
                if (this._cameraTween) this._cameraTween.kill();
                this._cameraTween = gsap.to(this.camera.position, {
                    x: t.position.x, y: t.position.y, z: t.position.z,
                    duration: 1.5, ease: "power2.out"
                });
                if (t.fov) {
                    gsap.to(this.camera, { fov: t.fov, duration: 1.5, onUpdate: () => this.camera.updateProjectionMatrix() });
                }
            }
        } finally {
            this._isActivating = false;
        }
    }

    update(scrollProgress, time, delta) {
        const actNumber = this.getActForProgress(scrollProgress);
        this.activateAct(actNumber);

        const freq = this.audioManager ? this.audioManager.getFrequencyLevel() : 0;

        if (this.acts[actNumber] && this.preloadedActs.has(actNumber)) {
            const [s, e] = this.actRanges[actNumber];
            const lp = Math.max(0, Math.min(1, (scrollProgress - s) / (e - s)));
            try {
                this.acts[actNumber].update(lp, time, delta, this.mouse, freq);
            } catch (err) { }
        }

        return { actNumber, actName: this.actNames[actNumber] };
    }

    dispose() {
        Object.values(this.acts).forEach(act => { if (act.dispose) act.dispose(); });
    }
}
