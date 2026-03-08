// ============================================
// ACT 9 — HOME INTERIOR (SILENT V5.0)
// Procedural Dark Room & Negative Atmosphere
// ============================================
import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

export class Act9_HomeScene {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._sfxPlayed = false;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 5, 15), fov: 60 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        // 1. Room Geometry (Dark Box)
        const roomGeo = new THREE.BoxGeometry(40, 30, 60);
        const roomMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a14, side: THREE.BackSide, roughness: 0.9, metalness: 0.1
        });
        this.room = new THREE.Mesh(roomGeo, roomMat);
        this.group.add(this.room);

        // 2. Bed & Girl (Procedural Placeholder)
        const bed = new THREE.Mesh(
            new THREE.BoxGeometry(10, 2, 18),
            new THREE.MeshStandardMaterial({ color: 0x151525 })
        );
        bed.position.set(-8, -13, -10);
        this.group.add(bed);

        // Simple Girl Figure
        this.girl = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(1, 4, 4, 8), new THREE.MeshStandardMaterial({ color: 0x2a2a3a }));
        body.rotation.z = Math.PI / 2;
        this.girl.add(body);
        this.girl.position.set(-8, -12, -10);
        this.group.add(this.girl);

        // 3. Negative Energy Particles
        this._initNegativeParticles();

        // 4. Lights (Low Key / Anxious)
        this.pntLight = new THREE.PointLight(0xff3344, 1.5, 30);
        this.pntLight.position.set(0, 5, 0);
        this.group.add(this.pntLight);

        this.cameraPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(15, 10, 40), new THREE.Vector3(5, 2, 20), new THREE.Vector3(-6, -10, -5), new THREE.Vector3(-8, -11, -8)
        ]);

        this.initialized = true;
        this.active = true;
    }

    _initNegativeParticles() {
        const count = 5000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const tex = createCircleTexture('#ffffff', 64);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 40;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x220000, size: 0.2, map: tex, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
        }));
        this.group.add(this.particles);
    }

    update(progress, time, delta, mouse, audio) {
        if (!this.active || !this.initialized) return;
        const aBoost = (audio || 0);

        if (progress > 0.1 && !this._sfxPlayed) {
            if (window.app && window.app.audio) window.app.audio.playSFX('ambient_neighborhood', { volume: 0.5 });
            this._sfxPlayed = true;
        }

        this.particles.rotation.y = time * 0.05;
        this.pntLight.intensity = 1.5 + Math.sin(time * 5.0) * 0.5 + aBoost * 5.0;

        if (this.cameraPath) {
            this.camera.position.copy(this.cameraPath.getPointAt(progress));
            // Look toward the girl/phone area
            this.camera.lookAt(-8, -12, -10);
        }

        // Trigger Phone UI when close
        const phone = document.getElementById('phoneOverlay');
        if (phone) {
            if (progress > 0.6) {
                phone.classList.add('visible');
                // Zoom effect: as we approach 1.0, the phone frame fills screen
                const scale = 1.0 + (progress - 0.6) * 2.5;
                phone.querySelector('.phone-frame').style.transform = `scale(${scale})`;
                if (progress > 0.96) phone.querySelector('.phone-frame').classList.add('fullscreen');
                else phone.querySelector('.phone-frame').classList.remove('fullscreen');

                this._updatePhoneUI((progress - 0.6) / 0.4);
            } else {
                phone.classList.remove('visible');
                this._phoneScreenState = 'hidden';
            }
        }
    }

    _updatePhoneUI(progress) {
        const ps = document.getElementById('phoneScreen');
        if (!ps) return;

        let state = 'ig';
        if (progress < 0.3) state = 'ig';
        else if (progress < 0.5) state = 'ig_comments';
        else if (progress < 0.65) state = 'ig_negative';
        else if (progress < 0.8) state = 'lyra_ad';
        else if (progress < 0.95) state = 'appstore';
        else state = 'app_open';

        if (this._phoneScreenState !== state) {
            this._phoneScreenState = state;
            if (state === 'ig') ps.innerHTML = this._igHTML();
            else if (state === 'ig_comments') ps.innerHTML = this._igCommentsHTML();
            else if (state === 'ig_negative') ps.innerHTML = this._igNegativeTriggerHTML();
            else if (state === 'lyra_ad') ps.innerHTML = this._lyraAdHTML();
            else if (state === 'appstore') ps.innerHTML = this._appStoreHTML();
            else if (state === 'app_open') ps.innerHTML = this._appOpenHTML();
        }
    }

    _igHTML() {
        return `
            <div class="ig-header"><span class="ig-header-logo">Instagram</span></div>
            <div class="ig-post">
                <div class="ig-post-header"><div class="ig-avatar"></div><div class="ig-username">selin_vibe</div></div>
                <div class="ig-post-image">🌫️</div>
                <div class="ig-actions">
                    <span class="ig-action-btn">❤️</span>
                    <span class="ig-action-btn">💬</span>
                </div>
                <div class="ig-likes">2.104 beğeni</div>
                <div class="ig-caption"><b>selin_vibe</b> Her şey çok güzel... ✨</div>
            </div>
        `;
    }

    _igCommentsHTML() {
        return this._igHTML() + `
            <div class="ig-comments-section">
                <div class="ig-comment"><span class="comment-user">user_88:</span><span class="comment-text">Harika!</span></div>
                <div class="ig-comment negative"><span class="comment-user">hater_01:</span><span class="comment-text">Yine mi sahte pozlar? 🙄</span></div>
                <div class="ig-comment negative"><span class="comment-user">troll_king:</span><span class="comment-text">Aslında ne kadar yalnızsın.</span></div>
            </div>
        `;
    }

    _igNegativeTriggerHTML() {
        return `
            <div class="ig-header"><span class="ig-header-logo">Yorumlar</span></div>
            <div class="ig-comments-section" style="padding-top: 40px;">
                <div class="ig-comment negative" style="font-size: 16px; opacity:1; animation: none;"><span class="comment-text">BOŞLUKTA KAYBOLUYORSUN...</span></div>
                <div class="ig-comment negative" style="font-size: 20px; margin-top: 30px; opacity:1; animation: none;"><span class="comment-text" style="color: #ff0000; font-weight: 900;">KİMSE SENİ ANLAMIYOR.</span></div>
            </div>
        `;
    }

    _lyraAdHTML() {
        return `
            <div class="ig-header"><span class="ig-header-logo">Instagram</span></div>
            <div class="ig-ad">
                <div class="ig-ad-label">Sponsorlu</div>
                <div class="ig-ad-title">Lyra AI</div>
                <div class="ig-ad-desc">Karanlığın ortasında seni gerçekten dinleyen biri var.</div>
                <div class="ig-ad-cta">Keşfet →</div>
            </div>
        `;
    }

    _appStoreHTML() {
        return `
            <div class="appstore-screen">
                <div class="appstore-search"><span class="appstore-search-text">Lyra AI</span></div>
                <div class="appstore-app">
                    <div class="appstore-app-icon">L</div>
                    <div class="appstore-app-info">
                        <div class="appstore-app-name">Lyra: AI Companion</div>
                        <div class="appstore-app-category">Health & Fitness</div>
                    </div>
                    <button class="appstore-get-btn downloading">YÜKLENİYOR</button>
                </div>
            </div>
        `;
    }

    _appOpenHTML() {
        return `
            <div class="appstore-screen">
                <div class="appstore-app" style="margin-top: 40px;">
                    <div class="appstore-app-icon">L</div>
                    <div class="appstore-app-info"><div class="appstore-app-name">Lyra</div></div>
                    <button class="appstore-get-btn open" onclick="window.location.reload();">AÇ</button>
                </div>
                <div style="color: #7C6FFF; text-align:center; margin-top: 40px; font-size: 10px; letter-spacing: 2px;">NEURAL_LINK_ACTIVE</div>
            </div>
        `;
    }

    deactivate() {
        this.active = false;
        const phone = document.getElementById('phoneOverlay');
        if (phone) {
            phone.classList.remove('visible');
            phone.querySelector('.phone-frame').classList.remove('fullscreen');
        }
    }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
