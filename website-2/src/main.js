// ============================================
// MAIN.JS — Entry Point & Master Orchestrator
// ============================================
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles/index.css';

import { SceneManager } from './scenes/SceneManager.js';
import { PostProcessingPipeline } from './utils/PostProcessing.js';
import { TextAnimator } from './utils/TextAnimator.js';
import { AudioManager } from './utils/AudioManager.js';

// Scene imports (7-act consolidated architecture)
import { Act1_BigBang } from './scenes/Act1_BigBang.js';
import { Act2_GalaxyFormation } from './scenes/Act2_GalaxyFormation.js';
import { Act4_Saturn } from './scenes/Act4_Saturn.js';
import { Act6_Earth } from './scenes/Act6_Earth.js';
import { Act7_Istanbul } from './scenes/Act7_Istanbul.js';
import { Act8_Neighborhood } from './scenes/Act8_Neighborhood.js';
import { Act9_HomeScene } from './scenes/Act9_HomeScene.js';
import { Act10_LyraReveal } from './scenes/Act10_LyraReveal.js';

gsap.registerPlugin(ScrollTrigger);

class LyraCinematicExperience {
    constructor() {
        this.clock = new THREE.Clock();
        this.scrollProgress = 0;
        this.currentAct = 0;
        this._lastAct = 0;
        this._init().catch(e => {
            console.error("FATAL ERROR DURING LYRA INIT:", e);
            const percent = document.getElementById('loaderPercent');
            if (percent) percent.textContent = "Hata! Konsolu kontrol edin.";
        });
    }

    async _init() {
        // === THREE.JS SETUP ===
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 0, 10);

        // === WEBGL2 RE-ARCHITECTURE ===
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
        });

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            context: gl,
            antialias: true,
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: true
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const container = document.getElementById('canvasContainer');
        container.appendChild(this.renderer.domElement);

        // === POST PROCESSING ===
        this.postProcessing = new PostProcessingPipeline(
            this.renderer, this.scene, this.camera
        );
        this.postProcessing.setPreset('bigbang');

        // === TEXT ANIMATOR ===
        this.textAnimator = new TextAnimator(
            document.getElementById('textOverlay')
        );

        // === AUDIO ===
        this.audio = new AudioManager();

        // === SCENE MANAGER (8-act architecture) ===
        this.sceneManager = new SceneManager(
            this.scene, this.camera, this.renderer, this.audio
        );

        // Register 8 narrative acts (V5.0)
        this.sceneManager.registerAct(1, new Act1_BigBang());
        this.sceneManager.registerAct(2, new Act2_GalaxyFormation());
        this.sceneManager.registerAct(3, new Act4_Saturn());
        this.sceneManager.registerAct(4, new Act6_Earth());
        this.sceneManager.registerAct(5, new Act7_Istanbul());
        this.sceneManager.registerAct(6, new Act8_Neighborhood());
        this.sceneManager.registerAct(7, new Act9_HomeScene());
        this.sceneManager.registerAct(8, new Act10_LyraReveal());

        // === 3D AUDIO REGISTRATION (V4 God-Tier) ===
        this.audio.register('ambient_bigbang', '/audio/bigbang_deep.mp3', { volume: 0.8, loop: true, spatial: true });
        this.audio.register('ambient_space', '/audio/space_void.mp3', { volume: 0.6, loop: true, spatial: true });
        this.audio.register('ambient_saturn', '/audio/saturn_hum.mp3', { volume: 0.7, loop: true, spatial: true });
        this.audio.register('ambient_earth', '/audio/earth_dynamic.mp3', { volume: 0.7, loop: true, spatial: true });
        this.audio.register('ambient_city', '/audio/istanbul_night.mp3', { volume: 0.6, loop: true, spatial: true });
        this.audio.register('ambient_neighborhood', '/audio/neighborhood_anxiety.mp3', { volume: 0.7, loop: true, spatial: true });
        this.audio.register('ambient_lyra', '/audio/lyra_crystal.mp3', { volume: 1.0, loop: true, spatial: true });

        // Load sounds but don't wait for them to block visual rendering
        this.audio.loadAll().catch(e => console.warn("Audio load error:", e));

        // Init first act
        await this.sceneManager.activateAct(1);

        // === SCROLL SETUP ===
        this._setupScroll();

        // === EVENT LISTENERS ===
        window.addEventListener('resize', this._onResize.bind(this));

        // === AUDIO TOGGLE ===
        const audioBtn = document.getElementById('audioToggle');
        audioBtn.addEventListener('click', () => {
            const muted = this.audio.toggleMute();
            audioBtn.querySelector('.audio-on').style.display = muted ? 'none' : 'block';
            audioBtn.querySelector('.audio-off').style.display = muted ? 'block' : 'none';
            if (muted) {
                audioBtn.classList.remove('playing');
            } else {
                audioBtn.classList.add('playing');
                // Ensure context is resumed/analyser is ready
                this.audio.initAnalyser();
            }
        });

        // === LOADING COMPLETE ===
        this._simulateLoading();

        // === START RENDER LOOP ===
        this._animate();
    }

    _simulateLoading() {
        const fill = document.getElementById('loaderBarFill');
        const percent = document.getElementById('loaderPercent');
        const subtitle = document.querySelector('.loader-subtitle');

        const loadingSteps = [
            "Evrenin Temelleri Atılıyor...",
            "Galaksiler Sentezleniyor...",
            "Yörünge Hesaplamaları Yapılıyor...",
            "Atmosferik Veriler Çekiliyor...",
            "İstanbul Silüeti Çiziliyor...",
            "Nöral Bağlantılar Kuruluyor...",
            "Bilinç Hazırlanıyor..."
        ];

        let p = { val: 0 };
        gsap.to(p, {
            val: 100,
            duration: 6,
            ease: "power2.inOut",
            onUpdate: () => {
                const rounded = Math.round(p.val);
                fill.style.width = rounded + '%';
                percent.textContent = rounded + '%';

                const stepIdx = Math.floor((p.val / 100) * (loadingSteps.length - 1));
                if (subtitle.textContent !== loadingSteps[stepIdx]) {
                    gsap.to(subtitle, {
                        opacity: 0, duration: 0.2, onComplete: () => {
                            subtitle.textContent = loadingSteps[stepIdx];
                            gsap.to(subtitle, { opacity: 1, duration: 0.2 });
                        }
                    });
                }
            },
            onComplete: () => {
                subtitle.textContent = "SİSTEM ÇALIŞMAYA HAZIR";
                gsap.to('#loader', {
                    opacity: 0,
                    scale: 1.1,
                    duration: 1.5,
                    ease: "expo.inOut",
                    delay: 0.8,
                    onComplete: () => {
                        document.getElementById('loader').style.display = 'none';
                        document.getElementById('audioToggle').classList.add('visible');

                        // Grand Entry Text
                        this.textAnimator.show(
                            'LYRA',
                            'Evrenden Sana Uzanan Yolculuk',
                            'hope'
                        );
                        setTimeout(() => this.textAnimator.hide(2), 5000);
                    }
                });
            }
        });
    }

    _setupScroll() {
        const spacer = document.getElementById('scrollSpacer');

        ScrollTrigger.create({
            trigger: spacer,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.5,
            onUpdate: (self) => {
                this.scrollProgress = self.progress;
            },
        });
    }

    _onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.postProcessing.resize(w, h);
    }

    _updateUI(actNumber, actName) {
        // Scroll progress bar
        const progressBar = document.getElementById('scrollProgress');
        if (progressBar) progressBar.style.width = (this.scrollProgress * 100) + '%';

        // Act indicator
        const indicator = document.getElementById('actIndicator');
        if (indicator) indicator.textContent = actName ? `${actName}` : '';

        // HUD Management (Act 6-7 only)
        const hud = document.getElementById('hudOverlay');
        if (hud) {
            if (actNumber >= 6) {
                hud.classList.add('visible');
                const hudData = document.getElementById('hudData');
                if (hudData && Math.random() > 0.95) {
                    const logs = [
                        `NEURAL_SYNC: ${Math.round(this.scrollProgress * 100)}%`,
                        `MEM_USAGE: ${Math.round(60 + Math.random() * 20)}MB`,
                        `LATENCY: ${Math.round(2 + Math.random() * 10)}MS`,
                        `STATUS: OPTIMAL`
                    ];
                    hudData.innerHTML = logs.map(l => `<div class="data-row">${l}</div>`).join('');
                }
            } else {
                hud.classList.remove('visible');
            }
        }

        // Cinematic text triggers
        if (actNumber !== this._lastAct) {
            this._onActChange(actNumber);
            this._lastAct = actNumber;
        }
    }

    _onActChange(actNumber) {
        // Post-processing presets (7-act)
        const presets = {
            1: 'bigbang',
            2: 'space',
            3: 'saturn',
            4: 'earth',
            5: 'city',
            6: 'space',
            7: 'negative',
            8: 'hope',
        };
        this.postProcessing.setPreset(presets[actNumber] || 'space');

        // Audio Crossfade (V4 Spatial)
        const soundMap = {
            1: 'ambient_bigbang',
            2: 'ambient_space',
            3: 'ambient_saturn',
            4: 'ambient_earth',
            5: 'ambient_city',
            6: 'ambient_neighborhood',
            7: 'ambient_neighborhood',
            8: 'ambient_lyra',
        };
        if (soundMap[actNumber]) {
            this.audio.crossfadeAmbient(soundMap[actNumber]);
        }

        // Cinematic text for each act (7-act)
        const texts = {
            1: { title: '', subtitle: '' },
            2: { title: 'Ve galaksiler doğdu...', subtitle: '13.8 milyar yıl önce' },
            3: { title: 'Satürn', subtitle: 'Güneş sisteminin mücevheri' },
            4: { title: 'Dünya', subtitle: 'Mavi gezegenimiz' },
            5: { title: 'İstanbul', subtitle: 'İki kıtanın buluştuğu şehir' },
            6: { title: '', subtitle: '', className: 'negative' },
            7: { title: '', subtitle: '', className: 'hope' },
        };

        const t = texts[actNumber];
        if (t && t.title) {
            this.textAnimator.show(t.title, t.subtitle, t.className || '');
            setTimeout(() => this.textAnimator.hide(1), 3000);
        } else {
            this.textAnimator.hide(0.5);
        }

        // Interaction hints (7-act)
        const hints = {
            2: 'Mouse ile galaksileri döndür',
            3: 'Mouse ile Satürn\'ü keşfet',
            4: 'Mouse ile Dünya\'yı döndür',
            5: 'Mouse ile İstanbul\'u keşfet',
            6: 'Mouse ile karanlığı aydınlat',
        };

        const hintEl = document.getElementById('interactionHint');
        const hintText = document.getElementById('hintText');
        if (hintEl && hintText) {
            if (hints[actNumber]) {
                hintText.textContent = hints[actNumber];
                hintEl.style.display = 'flex';
                setTimeout(() => { hintEl.style.display = 'none'; }, 4000);
            } else {
                hintEl.style.display = 'none';
            }
        }
    }


    _animate() {
        requestAnimationFrame(this._animate.bind(this));

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // Update scenes
        const { actNumber, actName } = this.sceneManager.update(
            this.scrollProgress, time, delta
        );

        // Update UI
        this._updateUI(actNumber, actName);

        // Update Spatial Audio (V4 God-Tier)
        this.audio.updateListener(this.camera);

        // Special case: Saturn spatial positioning
        if (actNumber === 3) {
            this.audio.updatePosition('ambient_saturn', 0, 0, -50);
        }

        // Render with post-processing
        this.postProcessing.render(delta);
    }
}

// Start the experience
new LyraCinematicExperience();
