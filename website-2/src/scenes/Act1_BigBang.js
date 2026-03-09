import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

export class Act1_BigBang {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._sfxPlayed = false;
        this._sfxPhase2 = false;
    }

    getCameraTarget() {
        return { position: new THREE.Vector3(0, 0, 150), fov: 45 };
    }

    async init(scene, camera, renderer) {
        if (this.initialized) return;
        this.scene = scene;
        this.camera = camera;

        if (renderer) {
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;
        }

        const circleTex = createCircleTexture('#ffffff', 128);
        const loader = new THREE.TextureLoader();
        let bgTex = null;
        try { bgTex = loader.load('/textures/8k_stars_milky_way.jpg'); } catch (e) { }

        this._initSingularity();
        this._initPlasmaField(circleTex);
        this._initCosmicWeb(bgTex);
        this._initProtoSolarSystem();
        this._initAnamorphicFlares();

        this.initialized = true;
        this.active = true;

        this.plasmaGroup.visible = false;
        this.webGroup.visible = false;
        this.solarGroup.visible = false;
    }

    // ==========================================================
    // PHASE 1: THE SINGULARITY
    // ==========================================================
    _initSingularity() {
        this.singularityGroup = new THREE.Group();

        const pointGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const pointMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.singularityPoint = new THREE.Mesh(pointGeo, pointMat);
        this.singularityGroup.add(this.singularityPoint);

        this.haloMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uIntensity: { value: 1.0 } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float uIntensity; varying vec2 vUv;
                void main() {
                    float d = length(vUv - 0.5);
                    float glow = exp(-d * 20.0) * 10.0;
                    gl_FragColor = vec4(vec3(0.95, 0.98, 1.0) * glow * uIntensity, glow * uIntensity);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.halo = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), this.haloMat);
        this.singularityGroup.add(this.halo);

        this.singularityLight = new THREE.PointLight(0xffffff, 0, 1500);
        this.singularityGroup.add(this.singularityLight);

        this.group.add(this.singularityGroup);
    }

    // ==========================================================
    // PHASE 2: QUARK-GLUON PLASMA (The Great Expansion)
    // ==========================================================
    _initPlasmaField(tex) {
        this.plasmaGroup = new THREE.Group();
        const count = 300000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const dir = new Float32Array(count * 3);
        const noiseOff = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const u = Math.random(); const v = Math.random();
            const theta = 2 * Math.PI * u; const phi = Math.acos(2 * v - 1);
            const x = Math.sin(phi) * Math.cos(theta); const y = Math.sin(phi) * Math.sin(theta); const z = Math.cos(phi);
            const r = Math.pow(Math.random(), 3) * 5.0;

            pos[i * 3] = x * r; pos[i * 3 + 1] = y * r; pos[i * 3 + 2] = z * r;
            dir[i * 3] = x; dir[i * 3 + 1] = y; dir[i * 3 + 2] = z;
            noiseOff[i] = Math.random() * 100.0;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
        geo.setAttribute('aNoise', new THREE.BufferAttribute(noiseOff, 1));

        this.plasmaMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uExpansion: { value: 0 }, uCooling: { value: 0 }, uMap: { value: tex } },
            vertexShader: `
                uniform float uTime; uniform float uExpansion; uniform float uCooling;
                attribute vec3 aDir; attribute float aNoise;
                varying vec3 vColor; varying float vAlpha;
                
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; } vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); } vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ; const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy) ); vec3 x0 = v - i + dot(i, C.xxx) ;
                    vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy ); vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
                    i = mod289(i); 
                    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                    float n_ = 0.142857142857; vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_ );
                    vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy ); vec4 b1 = vec4( x.zw, y.zw ); vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0)); vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3))); p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m; return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                void main() {
                    vec3 pos = position + aDir * uExpansion * 500.0;
                    float noise = snoise(pos * 0.01 + uTime * 0.1 + aNoise);
                    pos += aDir * noise * uExpansion * 60.0; 
                    
                    vec3 tempHot = vec3(1.0, 0.95, 1.0);
                    vec3 tempWarm = vec3(1.0, 0.4, 0.0); 
                    vec3 tempCold = vec3(0.05, 0.0, 0.02); 
                    
                    vec3 color = mix(tempHot, tempWarm, smoothstep(0.0, 0.5, uCooling));
                    color = mix(color, tempCold, smoothstep(0.5, 1.0, uCooling));
                    vColor = color * (1.0 + (1.0-uCooling)*5.0); 
                    
                    float density = smoothstep(-0.5, 0.5, noise);
                    vAlpha = mix(1.0, density, uCooling);
                    vAlpha *= (1.0 - uExpansion * 0.5); 
                    
                    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = (2.0 + (1.0-uCooling)*12.0) * (600.0 / -mv.z);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                uniform sampler2D uMap; varying vec3 vColor; varying float vAlpha;
                void main() { float t = texture2D(uMap, gl_PointCoord).a; if(t < 0.1) discard; gl_FragColor = vec4(vColor, t * vAlpha * 0.8); }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });

        this.plasma = new THREE.Points(geo, this.plasmaMat);
        this.plasmaGroup.add(this.plasma);
        this.group.add(this.plasmaGroup);
    }

    // ==========================================================
    // PHASE 3: THE COSMIC WEB & FIRST STARS
    // ==========================================================
    _initCosmicWeb(bgTex) {
        this.webGroup = new THREE.Group();

        if (bgTex) { bgTex.mapping = THREE.EquirectangularReflectionMapping; bgTex.colorSpace = THREE.SRGBColorSpace; }
        const skyGeo = new THREE.SphereGeometry(2500, 64, 64);
        const skyMat = new THREE.MeshBasicMaterial({ map: bgTex, color: 0xffffff, side: THREE.BackSide, depthWrite: false, transparent: true, opacity: 0 });
        this.milkyWaySphere = new THREE.Mesh(skyGeo, skyMat);
        this.milkyWaySphere.rotation.x = -Math.PI / 8;
        this.webGroup.add(this.milkyWaySphere);

        const starCount = 20000;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        const starCols = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const r = 200 + Math.pow(Math.random(), 2) * 1200;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPos[i * 3 + 2] = r * Math.cos(phi);

            const c = (Math.random() > 0.6) ? new THREE.Color(0xccddff) : new THREE.Color(0xfff5e6);
            starCols[i * 3] = c.r; starCols[i * 3 + 1] = c.g; starCols[i * 3 + 2] = c.b;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starCols, 3));

        this.firstStarsMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
            vertexShader: `
                uniform float uReveal; attribute vec3 color; varying vec3 vColor;
                void main() {
                    vColor = color; vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = (12.0 * (1.0-uReveal) + 1.2) * (500.0 / -mv.z);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                uniform float uReveal; varying vec3 vColor;
                void main() {
                    float d = length(gl_PointCoord - 0.5);
                    float core = exp(-d * mix(5.0, 15.0, uReveal)); 
                    gl_FragColor = vec4(vColor * core * 3.0, core * uReveal * smoothstep(0.0, 0.2, uReveal));
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });

        this.firstStars = new THREE.Points(starGeo, this.firstStarsMat);
        this.webGroup.add(this.firstStars);
        this.group.add(this.webGroup);
    }

    // ==========================================================
    // PHASE 4: THE NEWBORN SOLAR SYSTEM (Cinematic Polish)
    // ==========================================================
    _initProtoSolarSystem() {
        this.solarGroup = new THREE.Group();

        // A. The Sun (With Fiery Corona)
        this.sunGroup = new THREE.Group();
        this.sunGroup.position.set(0, 0, -250); // Deep in the background

        const sunGeo = new THREE.SphereGeometry(30, 64, 64);

        // Procedural blazing sun shader instead of plain BasicMaterial
        this.sunMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
            vertexShader: `varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float uTime; uniform float uReveal; varying vec3 vPos;
                float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
                float noise(vec3 p) {
                    vec3 i = floor(p); vec3 f = fract(p); vec3 u = f*f*(3.0-2.0*f);
                    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), u.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
                               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y), u.z);
                }
                void main() {
                    float n = noise(vPos * 0.15 + uTime * 0.5) * 0.5 + noise(vPos * 0.3 - uTime * 0.3) * 0.5;
                    vec3 colHot = vec3(1.0, 0.9, 0.8); vec3 colWarm = vec3(1.0, 0.4, 0.0);
                    vec3 color = mix(colHot, colWarm, n);
                    gl_FragColor = vec4(color * 2.5, uReveal);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending
        });
        this.sun = new THREE.Mesh(sunGeo, this.sunMat);
        this.sunGroup.add(this.sun);

        // Sun glow
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
        this.sunGlow = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 32), glowMat);
        this.sunGroup.add(this.sunGlow);

        this.sunLight = new THREE.PointLight(0xfff5e6, 0, 2000);
        this.sunLight.position.copy(this.sunGroup.position);
        this.solarGroup.add(this.sunLight);

        // B. Molten Proto-Earth (Hadean Eon - High Detail)
        const earthGeo = new THREE.SphereGeometry(4, 128, 128);
        this.earthMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uSunPos: { value: this.sunGroup.position } },
            vertexShader: `
                varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorldPosition; varying vec3 vViewPosition;
                void main() {
                    vUv = uv;
                    vec4 worldPos = modelMatrix * vec4(position, 1.0); vWorldPosition = worldPos.xyz;
                    vec4 mvPos = viewMatrix * worldPos; vViewPosition = -mvPos.xyz;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * mvPos;
                }
            `,
            fragmentShader: `
                uniform float uTime; uniform float uReveal; uniform vec3 uSunPos;
                varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorldPosition; varying vec3 vViewPosition;
                
                float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
                float noise(vec2 p) {
                    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
                    return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x), mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
                }
                float fbm(vec2 p) {
                    float v = 0.0; float a = 0.5; mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
                    for (int i=0; i<6; ++i) { v += a * noise(p); p = rot * p * 2.0; a *= 0.5; }
                    return v;
                }

                void main() {
                    vec3 sunDir = normalize(uSunPos - vWorldPosition);
                    vec3 normal = normalize(vNormal);
                    float diff = max(dot(normal, sunDir), 0.0);
                    
                    // High detail volcanic crust mapping
                    vec2 polar = vec2(vUv.x * 20.0, vUv.y * 10.0);
                    float crustNoise = fbm(polar + uTime * 0.05);
                    float magmaFissures = smoothstep(0.4, 0.6, crustNoise);
                    
                    vec3 magmaColor = vec3(1.0, 0.3, 0.0) * (3.0 * (1.0 - magmaFissures)); // Bright lava
                    vec3 rockColor = vec3(0.05, 0.05, 0.05); // Dark cooling basalt
                    
                    // Combine rock and magma
                    vec3 surface = mix(magmaColor, rockColor, magmaFissures);
                    
                    // Lighting only affects the rock, magma is emissive
                    vec3 litSurface = surface * diff * 2.0 + (magmaColor * 1.5);
                    
                    // Thin toxic atmosphere rim
                    vec3 viewDir = normalize(vViewPosition);
                    float rim = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
                    vec3 atmColor = vec3(0.5, 0.1, 0.0) * pow(rim, 3.0) * diff * 4.0; 
                    
                    // Reveal fade
                    float fade = smoothstep(0.0, 0.2, uReveal);
                    gl_FragColor = vec4((litSurface + atmColor) * fade, fade);
                }
            `,
            transparent: true
        });

        this.earth = new THREE.Mesh(earthGeo, this.earthMat);
        this.solarGroup.add(this.earth);

        // Protoplanetary Dust Ring around Sun
        const ringGeo = new THREE.RingGeometry(80, 200, 128);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
        this.dustRing = new THREE.Mesh(ringGeo, ringMat);
        this.dustRing.rotation.x = Math.PI / 2.1;
        this.dustRing.position.copy(this.sunGroup.position);
        this.solarGroup.add(this.dustRing);

        this.solarGroup.add(this.sunGroup);
        this.group.add(this.solarGroup);
    }

    _initAnamorphicFlares() {
        this.flareMat = new THREE.ShaderMaterial({
            uniforms: { uIntensity: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float uIntensity; uniform vec3 uColor; varying vec2 vUv;
                void main() {
                    float flare = smoothstep(0.5, 0.0, abs(vUv.y - 0.5) * 150.0) * smoothstep(0.5, 0.0, abs(vUv.x - 0.5));
                    gl_FragColor = vec4(uColor * flare * uIntensity * 2.0, flare * uIntensity * 0.5);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        // Make flare very wide but thin
        this.flare = new THREE.Mesh(new THREE.PlaneGeometry(1600, 15), this.flareMat);
        this.group.add(this.flare);
    }

    // ==========================================================
    // CHOREOGRAPHY UPDATE LOOP
    // ==========================================================
    update(progress, time, delta, mouse) {
        if (!this.active || !this.initialized) return;

        let ph1 = Math.min(1.0, progress / 0.15);
        let ph2 = Math.max(0, Math.min(1.0, (progress - 0.15) / 0.25));
        let ph3 = Math.max(0, Math.min(1.0, (progress - 0.40) / 0.30));
        let ph4 = Math.max(0, Math.min(1.0, (progress - 0.70) / 0.30));

        // Camera track: Start deep, fly backwards to reveal the whole solar system
        this.camera.position.z = 150 - (progress * 130);

        // --- PHASE 1: SINGULARITY (0.0 to 0.15) ---
        if (ph1 < 1.0) {
            this.singularityGroup.visible = true; this.plasmaGroup.visible = false;
            this.webGroup.visible = false; this.solarGroup.visible = false;

            const flash = Math.pow(ph1, 8.0);
            this.haloMat.uniforms.uIntensity.value = 1.0 + flash * 300.0;
            this.singularityLight.intensity = flash * 6000.0;

            this.flareMat.uniforms.uColor.value.setHex(0xffffff);
            this.flareMat.uniforms.uIntensity.value = flash * 150.0;
            this.flare.position.z = this.camera.position.z - 20;

            if (ph1 > 0.8) {
                if (!this._sfxPlayed && window.app && window.app.audio) {
                    window.app.audio.playSFX('ambient_bigbang', { volume: 3.5 });
                    this._sfxPlayed = true;
                }
                const shake = (ph1 - 0.8) * 10.0;
                this.camera.position.x += (Math.random() - 0.5) * shake;
                this.camera.position.y += (Math.random() - 0.5) * shake;
            } else {
                this.camera.position.x = 0; this.camera.position.y = 0;
            }
        }

        // --- PHASE 2: PLASMA EXPANSION (0.15 to 0.40) ---
        else if (ph2 < 1.0) {
            this.singularityGroup.visible = false; this.plasmaGroup.visible = true;
            this.webGroup.visible = false; this.solarGroup.visible = false;

            this.plasmaMat.uniforms.uTime.value = time;
            this.plasmaMat.uniforms.uExpansion.value = ph2;
            this.plasmaMat.uniforms.uCooling.value = Math.pow(ph2, 0.8);

            const fade = 1.0 - ph2;
            this.flareMat.uniforms.uColor.value.lerp(new THREE.Color(0xff3300), ph2);
            this.flareMat.uniforms.uIntensity.value = fade * 100.0;

            this.camera.position.x = 0; this.camera.position.y = 0;
        }

        // --- PHASE 3: COSMIC WEB & FIRST STARS (0.40 to 0.70) ---
        else if (ph3 < 1.0) {
            this.singularityGroup.visible = false; this.plasmaGroup.visible = false;
            this.webGroup.visible = true; this.solarGroup.visible = false;

            if (!this._sfxPhase2 && window.app && window.app.audio) { this._sfxPhase2 = true; }

            this.milkyWaySphere.material.opacity = ph3 * 0.8;
            this.milkyWaySphere.rotation.y = time * 0.05 + ph3 * Math.PI;

            this.firstStarsMat.uniforms.uReveal.value = ph3;
            this.firstStarsMat.uniforms.uTime.value = time;
            this.webGroup.rotation.y = time * 0.02;

            this.flareMat.uniforms.uIntensity.value = 0.0;
            this.camera.position.x = 0; this.camera.position.y = 0;
            this.camera.lookAt(0, 0, -250); // Look towards where the sun will be
        }

        // --- PHASE 4: THE NEWBORN SOLAR SYSTEM (0.70 to 1.00) ---
        else {
            this.singularityGroup.visible = false; this.plasmaGroup.visible = false;
            this.webGroup.visible = true; this.solarGroup.visible = true;

            this.milkyWaySphere.material.opacity = 0.8;
            this.milkyWaySphere.rotation.y += delta * 0.01;

            // Ignite the sun
            this.sunMat.uniforms.uReveal.value = ph4;
            this.sunMat.uniforms.uTime.value = time;
            this.sunGlow.material.opacity = ph4 * 0.3;
            this.sunLight.intensity = ph4 * 25000.0; // Very bright

            // Dust ring
            this.dustRing.material.opacity = ph4 * 0.15;
            this.dustRing.rotation.z -= delta * 0.1;

            // Earth passes majestically IN FRONT of the camera, not crashing into it
            const eOrbitAngle = -ph4 * Math.PI * 0.6; // Sweeping arc
            const eDist = 80.0;
            this.earth.position.set(
                this.sunGroup.position.x + Math.sin(eOrbitAngle) * eDist,
                0,
                this.sunGroup.position.z + Math.cos(eOrbitAngle) * eDist
            );

            this.earth.rotation.y += delta * 0.5;
            this.earthMat.uniforms.uTime.value = time;
            this.earthMat.uniforms.uReveal.value = ph4;

            // Subtle elegant cinematic flare (thinner, locked to sun)
            this.flareMat.uniforms.uColor.value.setHex(0xffaa55);
            this.flareMat.uniforms.uIntensity.value = ph4 * 10.0;
            this.flare.position.copy(this.sunGroup.position);
            this.flare.position.z += 10; // slightly in front of sun

            // Camera glides past the earth towards the sun
            this.camera.position.x = mouse.normalizedX * 10.0;
            this.camera.position.y = mouse.normalizedY * 10.0;
            this.camera.position.z = 100 - (ph4 * 120); // Moving deeply into the system

            // Camera looks at sun, keeping Earth dramatically crossing the frame
            this.camera.lookAt(this.sunGroup.position);
        }
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
