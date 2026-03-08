// ============================================
// ACT 9 — PHONE SCENE: DISCOVERY & EMOTION
// Neural Shaders → Cinematic Phone Glow → Glass Physics
// ============================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCircleTexture } from '../utils/SpriteUtils.js';

export class Act9_PhoneScene {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._phoneScreenState = 'hidden';
    }

    async init(scene, camera) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;
        const circleTex = createCircleTexture('#ffffff', 64);

        // === Neural Brain Shader (The "Mind" of the user) ===
        const neuralVertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const neuralFragmentShader = `
            uniform float uTime;
            uniform float uProgress;
            uniform vec3 uBaseColor;
            uniform vec3 uPulseColor;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                
                // Neural 'Firing' pulse
                float pulse = sin(vPosition.y * 5.0 - uTime * 3.0) * 0.5 + 0.5;
                pulse *= sin(vPosition.x * 3.0 + uTime * 2.0);
                
                vec3 finalColor = mix(uBaseColor, uPulseColor, pulse * fresnel);
                float alpha = mix(0.1, 0.6, fresnel + pulse * 0.2);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;

        this.neuralMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0 },
                uBaseColor: { value: new THREE.Color(0x050515) },
                uPulseColor: { value: new THREE.Color(0xff3333) }
            },
            vertexShader: neuralVertexShader,
            fragmentShader: neuralFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        // Load 3D Mind
        const gltfLoader = new GLTFLoader();
        try {
            const gltf = await gltfLoader.loadAsync('/models/mind.glb');
            this.mindMesh = gltf.scene.children[0];
            this.mindMesh.material = this.neuralMat;
            this.mindMesh.scale.set(15, 15, 15);
            this.mindMesh.position.set(0, -5, -8);
            this.mindMesh.rotation.y = -Math.PI / 6;
            this.group.add(this.mindMesh);
        } catch (e) {
            console.error("Neural model fail", e);
        }

        // === 3D Phone with Cinematic Glow ===
        this.phone3D = new THREE.Group();
        const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 7.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.9, roughness: 0.1 }));
        this.phone3D.add(phoneBody);

        this.screenMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x223344, emissiveIntensity: 1.0 });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 7.1), this.screenMat);
        screen.position.z = 0.16;
        this.phone3D.add(screen);

        // Volumetric Glow Sprite (Soft Pixar Glow)
        this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0x7c6fff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
        this.glow.scale.set(12, 12, 1);
        this.glow.position.z = -0.5;
        this.phone3D.add(this.glow);

        this.phone3D.position.set(0, -12, 5);
        this.group.add(this.phone3D);

        // Face Light
        this.faceLight = new THREE.PointLight(0xaaccff, 0, 15);
        this.faceLight.position.set(0, 0, 3);
        this.phone3D.add(this.faceLight);

        // Particles
        this._initParticles(circleTex);

        scene.add(this.group);
        this.initialized = true;
        this.active = true;
    }

    _initParticles(circleTex) {
        // Negative (Red/Dark)
        const nGeo = new THREE.BufferGeometry();
        const nPos = new Float32Array(3000 * 3);
        const nCol = new Float32Array(3000 * 3);
        for (let i = 0; i < 3000; i++) {
            const i3 = i * 3;
            nPos[i3] = (Math.random() - 0.5) * 50; nPos[i3 + 1] = (Math.random() - 0.5) * 40; nPos[i3 + 2] = -10 - Math.random() * 20;
            const c = new THREE.Color().setHSL(0, 0.9, 0.1 + Math.random() * 0.1);
            nCol[i3] = c.r; nCol[i3 + 1] = c.g; nCol[i3 + 2] = c.b;
        }
        nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
        nGeo.setAttribute('color', new THREE.BufferAttribute(nCol, 3));
        this.negP = new THREE.Points(nGeo, new THREE.PointsMaterial({ size: 1.2, map: circleTex, vertexColors: true, transparent: true, opacity: 0, depthWrite: false }));
        this.group.add(this.negP);

        // Hope (Purple/Bright)
        const hGeo = new THREE.BufferGeometry();
        const hPos = new Float32Array(2000 * 3);
        const hCol = new Float32Array(2000 * 3);
        for (let i = 0; i < 2000; i++) {
            const i3 = i * 3;
            hPos[i3] = (Math.random() - 0.5) * 40; hPos[i3 + 1] = (Math.random() - 0.5) * 40; hPos[i3 + 2] = -5 - Math.random() * 15;
            const c = new THREE.Color().setHSL(0.7, 0.8, 0.6 + Math.random() * 0.4);
            hCol[i3] = c.r; hCol[i3 + 1] = c.g; hCol[i3 + 2] = c.b;
        }
        hGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3));
        hGeo.setAttribute('color', new THREE.BufferAttribute(hCol, 3));
        this.hopeP = new THREE.Points(hGeo, new THREE.PointsMaterial({ size: 2.0, map: circleTex, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        this.group.add(this.hopeP);
    }

    update(progress, time, delta, mouse, audioLevel) {
        if (!this.active || !this.initialized) return;
        this.neuralMat.uniforms.uTime.value = time;
        this.neuralMat.uniforms.uProgress.value = progress;
        this.neuralMat.uniforms.uAudioLevel.value = audioLevel || 0; // Pass audioLevel to shader

        const phase1 = Math.min(1.0, progress / 0.3); // Rise
        const phase2 = Math.max(0, Math.min(1.0, (progress - 0.3) / 0.35)); // Anxiety
        const phase3 = Math.max(0, Math.min(1.0, (progress - 0.65) / 0.35)); // Hope

        // Phone Movement
        this.phone3D.position.y = -12 + phase1 * 12;
        this.phone3D.rotation.x = -0.2 + phase1 * 0.2;

        // Dynamic Lighting & Shaders
        if (phase3 > 0) { // CALM PHASE
            this.neuralMat.uniforms.uBaseColor.value.setHex(0x050515);
            this.neuralMat.uniforms.uPulseColor.value.setHex(0x7c6fff);
            this.screenMat.emissive.setHex(0x7c6fff);
            this.faceLight.color.setHex(0x7c6fff);
            this.glow.material.color.setHex(0x7c6fff);
            this.glow.material.opacity = phase3 * 0.5;
            this.hopeP.material.opacity = phase3 * 0.8;
            this.negP.material.opacity = Math.max(0, 1.0 - phase3 * 2.0);
        } else if (phase2 > 0) { // ANXIOUS PHASE
            this.neuralMat.uniforms.uBaseColor.value.setHex(0x150000);
            this.neuralMat.uniforms.uPulseColor.value.setHex(0xff3333);
            this.screenMat.emissive.setHex(0xff1111);
            this.faceLight.color.setHex(0xff1111);
            this.faceLight.intensity = 8 + Math.sin(time * 10) * 2;
            this.negP.material.opacity = 0.4 + phase2 * 0.6;
        } else { // START PHASE
            this.faceLight.intensity = phase1 * 8;
            this.negP.material.opacity = phase1 * 0.4;
        }

        this._updatePhoneUI(progress);

        if (mouse) {
            this.phone3D.rotation.y = mouse.normalizedX * 0.15;
            this.phone3D.rotation.x += mouse.normalizedY * 0.1;
            if (this.mindMesh) this.mindMesh.rotation.y = -Math.PI / 6 + mouse.normalizedX * 0.1;
        }
    }

    _updatePhoneUI(progress) {
        const po = document.getElementById('phoneOverlay'), ps = document.getElementById('phoneScreen'), pf = po?.querySelector('.phone-frame');
        if (!po || !ps) return;
        if (progress < 0.2) { po.style.display = 'none'; return; }
        po.style.display = 'flex';
        po.style.transform = `translate(-50%, -50%) perspective(1000px) rotateY(${this.phone3D.rotation.y}rad) rotateX(${this.phone3D.rotation.x}rad)`;

        if (progress < 0.30 && this._phoneScreenState !== 'ig') { ps.innerHTML = this._igHTML(); this._phoneScreenState = 'ig'; }
        else if (progress >= 0.30 && progress < 0.50 && this._phoneScreenState !== 'cm') { ps.innerHTML = this._igCommentsHTML(); this._phoneScreenState = 'cm'; }
        else if (progress >= 0.50 && progress < 0.65 && this._phoneScreenState !== 'nc') { ps.innerHTML = this._negCommentHTML(); this._phoneScreenState = 'nc'; }
        else if (progress >= 0.65 && progress < 0.80 && this._phoneScreenState !== 'ad') { ps.innerHTML = this._lyraAdHTML(); this._phoneScreenState = 'ad'; }
        else if (progress >= 0.80 && progress < 0.95 && this._phoneScreenState !== 'as') { ps.innerHTML = this._appStoreHTML(); this._phoneScreenState = 'as'; }
        else if (progress >= 0.95 && this._phoneScreenState !== 'op') { ps.innerHTML = this._appOpenHTML(); this._phoneScreenState = 'op'; }
    }

    _igHTML() { return `<div class="ig-header"><span>Instagram</span></div><div class="ig-post"><div class="ig-avatar"></div><div class="ig-username">ayse_yilmaz</div><div class="ig-post-image">\uD83D\uDCF8</div><div class="ig-likes">142 beğeni</div><div class="ig-caption">Bugün güzel bir gündü \u2728</div></div>`; }
    _igCommentsHTML() { return this._igHTML() + `<div class="ig-comment negative">troll_442: Güzel gün mü? \uD83D\uDE02</div><div class="ig-comment negative">dark_knight: Sahte pozitiflik \uD83E\uD22E</div>`; }
    _negCommentHTML() { return `<div style="padding:20px;color:#ff4444;font-weight:700;text-align:center">Yorumlar (14)</div><div class="ig-comment negative" style="font-size:18px">Sahte hayatlar...</div><div class="ig-comment negative" style="font-size:18px">Aslında yalnızsın \uD83C\uDFAD</div>`; }
    _lyraAdHTML() { return `<div class="ig-ad"><div class="ig-ad-label">Sponsorlu</div><div class="ig-ad-title">Lyra AI</div><div class="ig-ad-desc">Kendini yalnız hissetme. Seni anlayan bir rehber yanında.</div><a class="ig-ad-cta">Sohbete Başla →</a></div>`; }
    _appStoreHTML() { return `<div class="appstore-screen"><div class="appstore-app"><div class="appstore-app-icon">L</div><div class="appstore-app-name">Lyra</div><button class="appstore-get-btn downloading">İNDİRİLİYOR...</button></div></div>`; }
    _appOpenHTML() { return `<div class="appstore-screen"><div class="appstore-app"><div class="appstore-app-icon">L</div><div class="appstore-app-name">Lyra</div><button class="appstore-get-btn open" id="lyraOpenBtn">UYGULAMAYI AÇ</button></div></div>`; }

    deactivate() {
        if (this.group.parent) this.group.parent.remove(this.group);
        this.active = false;
        if (document.getElementById('phoneOverlay')) document.getElementById('phoneOverlay').style.display = 'none';
        this._phoneScreenState = 'hidden';
    }

    dispose() {
        this.deactivate();
        this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); } });
    }
}
