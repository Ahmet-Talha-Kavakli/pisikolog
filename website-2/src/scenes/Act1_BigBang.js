import * as THREE from 'three';
import { createCircleTexture } from '../utils/SpriteUtils.js';

/**
 * ACT 1: BIG BANG / THE COSMIC BEGINNING
 * Cinematic Overhaul V6.5 — "Marvel-Grade" Visuals
 * Focus: High-quality Singularity, Interactivity, and Fixed Orbit.
 */
export class Act1_BigBang {
    constructor() {
        this.group = new THREE.Group();
        this.initialized = false;
        this.active = false;
        this._sfxPlayed = false;

        // Interaction states
        this.mousePos = new THREE.Vector2(0, 0);
        this.earthVelocity = new THREE.Vector3(0, 0, 0);
        this.earthBasePos = new THREE.Vector3(0, 0, -250);
        this.isSwallowed = false;
        this.swallowProgress = 0;
        this.ejectProgress = 1;
        this.isDraggingEarth = false;
        this.mouseZPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

        this.raycaster = new THREE.Raycaster();
        this.tempVec = new THREE.Vector3();
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

        const circleTex = createCircleTexture('#ffffff', 256);
        const loader = new THREE.TextureLoader();
        let bgTex = null;
        try {
            bgTex = loader.load('/textures/8k_stars_milky_way.jpg');
        } catch (e) { }

        this._initSingularity();
        this._initPlasmaField(circleTex);
        this._initCosmicWeb(bgTex);
        this._initProtoSolarSystem();
        this._initCinematicFlares();

        this.initialized = true;
        this.active = true;

        this.singularityGroup.visible = true;
        this.plasmaGroup.visible = false;
        this.webGroup.visible = false;
        this.solarGroup.visible = false;

        window.addEventListener('mousedown', (e) => this._onMouseDown(e));
        window.addEventListener('mouseup', () => { this.isDraggingEarth = false; });
    }

    _onMouseDown(e) {
        if (!this.active || !this.camera) return;

        this.raycaster.setFromCamera(
            new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1),
            this.camera
        );

        // Check earth first
        if (this.earthMesh && this.earthMesh.visible && !this.isSwallowed) {
            const hit = this.raycaster.intersectObject(this.earthMesh);
            if (hit.length > 0) {
                this.isDraggingEarth = true;
                return;
            }
        }

        // "Büyük gezegene tıklama" tespiti (Spit out)
        const intersects = this.raycaster.intersectObject(this.sun);
        if (intersects.length > 0 && this.isSwallowed) {
            this.isSwallowed = false;
            this.ejectProgress = 0;
            if (window.app && window.app.audio) {
                window.app.audio.playSFX('ambient_bigbang', { volume: 2.5 });
            }
        }
    }

    _initSingularity() {
        this.singularityGroup = new THREE.Group();

        // 1. THE BOILING VOID SINGULARITY
        this.coreMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    // Pulsating deformation
                    vec3 pos = position * (1.0 + sin(uTime * 5.0) * 0.015);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uIntensity;
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vViewPosition;

                // Procedural Noise Functions for Boiling Plasma
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 = v - i + dot(i, C.xxx) ;
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i);
                    vec4 p = permute( permute( permute(
                                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                    float n_ = 0.142857142857;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                float fbm(vec3 p) {
                    float v = 0.0;
                    float a = 0.5;
                    vec3 shift = vec3(100);
                    for (int i = 0; i < 4; ++i) {
                        v += a * snoise(p);
                        p = p * 2.0 + shift;
                        a *= 0.5;
                    }
                    return v;
                }

                void main() {
                    vec3 viewDir = normalize(vViewPosition);                 
                    float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.5);
                    
                    // Complex noise mapping for boiling edge
                    vec3 noisePos = vec3(vNormal * 4.0) + vec3(uTime * 0.5, uTime * 0.2, -uTime * 0.8);
                    float noiseVal = fbm(noisePos) * 0.5 + 0.5;
                    
                    // Combine noise with fresnel for a violently burning edge
                    float edgeGlow = smoothstep(0.3, 1.0, fresnel * noiseVal * 1.5);
                    float pureEdge = smoothstep(0.7, 1.0, fresnel);
                    
                    // Deep abyss core vs blinding energy rim
                    vec3 coreColor = vec3(0.01, 0.0, 0.03); // Infinite void
                    vec3 rimColor = vec3(0.8, 0.9, 1.0) * (uIntensity * 1.5); // Intense blue-white plasma
                    vec3 brightRimColor = vec3(1.0, 1.0, 1.0) * (uIntensity * 2.0); // Blinding white tip
                    
                    vec3 color = mix(coreColor, rimColor, edgeGlow);
                    color = mix(color, brightRimColor, pureEdge);
                    
                    // Add subtle pulsing energy streaks inside the void
                    float innerPulse = snoise(vec3(vUv * 20.0, uTime)) * 0.5 + 0.5;
                    color += coreColor * innerPulse * 2.0;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            transparent: true,
            side: THREE.FrontSide
        });

        const coreGeo = new THREE.SphereGeometry(3.0, 64, 64);
        this.singularityPoint = new THREE.Mesh(coreGeo, this.coreMat);
        this.singularityGroup.add(this.singularityPoint);

        // 2. GLOWING HALO
        this.haloMat = new THREE.ShaderMaterial({
            uniforms: { uIntensity: { value: 1.0 }, uTime: { value: 0 } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float uIntensity; uniform float uTime; varying vec2 vUv;
                void main() {
                    float d = length(vUv - 0.5);
                    float glow = exp(-d * 8.0) * 1.5; // Tighter, cinematic light falloff
                    float noiseDistortion = sin(vUv.x * 20.0 + uTime) * cos(vUv.y * 20.0 - uTime) * 0.05; // Shimmering light
                    float finalDist = d + noiseDistortion;
                    float outerAura = smoothstep(0.5, 0.1, finalDist) * 0.5; // Deep space ambient light leaking
                    
                    vec3 color = mix(vec3(0.5, 0.7, 1.0), vec3(1.0, 1.0, 1.0), glow);
                    float alpha = (glow + outerAura) * uIntensity;
                    gl_FragColor = vec4(color * alpha, alpha);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.halo = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), this.haloMat);
        this.singularityGroup.add(this.halo);

        // 3. SHOCKWAVE
        const shockGeo = new THREE.TorusGeometry(1, 0.05, 16, 128);
        this.shockwaveMat = new THREE.ShaderMaterial({
            uniforms: { uReveal: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float uReveal; uniform vec3 uColor; varying vec2 vUv;
                void main() {
                    float alpha = (1.0 - uReveal) * 0.5;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.shockwave = new THREE.Mesh(shockGeo, this.shockwaveMat);
        this.shockwave.rotation.x = Math.PI / 2;
        this.shockwave.visible = false;
        this.singularityGroup.add(this.shockwave);

        // 4. ENERGY ACCRETION & TENDRILS
        this.tendrils = [];
        this.particlesGroup = new THREE.Group();
        this.singularityGroup.add(this.particlesGroup);

        // Circular accretion rings
        for (let i = 0; i < 6; i++) {
            const curve = new THREE.Mesh(
                new THREE.TorusGeometry(3.5 + i * 0.5, 0.01 + Math.random() * 0.02, 16, 200),
                new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.15 + Math.random() * 0.2, blending: THREE.AdditiveBlending })
            );
            curve.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            this.particlesGroup.add(curve);
            this.tendrils.push({ mesh: curve, speed: (3.0 - i * 0.4), axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), baseOpacity: curve.material.opacity });
        }

        // Chaotic lightning/energy tendrils
        for (let i = 0; i < 30; i++) {
            const curve = new THREE.Mesh(
                new THREE.TorusGeometry(3 + Math.random() * 8, 0.005 + Math.random() * 0.015, 8, 100, Math.PI * (0.5 + Math.random())),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending })
            );
            curve.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            this.particlesGroup.add(curve);
            this.tendrils.push({ mesh: curve, speed: 1.5 + Math.random() * 4.0, axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), baseOpacity: 0.05 + Math.random() * 0.2, isLightning: true });
        }

        this.singularityLight = new THREE.PointLight(0x88bbff, 0, 1000);
        this.singularityGroup.add(this.singularityLight);
        this.group.add(this.singularityGroup);
    }

    _initPlasmaField(tex) {
        this.plasmaGroup = new THREE.Group();
        const count = 400000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const dir = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const u = Math.random(); const v = Math.random();
            const th = 2 * Math.PI * u; const ph = Math.acos(2 * v - 1);
            const x = Math.sin(ph) * Math.cos(th); const y = Math.sin(ph) * Math.sin(th); const z = Math.cos(ph);
            pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
            dir[i * 3] = x; dir[i * 3 + 1] = y; dir[i * 3 + 2] = z;
            sizes[i] = Math.random();
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

        this.plasmaMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uExpansion: { value: 0 },
                uCooling: { value: 0 },
                uMap: { value: tex }
            },
            vertexShader: `
                uniform float uTime; uniform float uExpansion; uniform float uCooling;
                attribute vec3 aDir; attribute float aSize;
                varying vec3 vColor; varying float vAlpha;
                void main() {
                    float expPow = pow(uExpansion, 0.7);
                    
                    // Add slight movement/wobble over time
                    vec3 movedDir = aDir;
                    movedDir.x += sin(uTime * 2.0 + aSize * 10.0) * 0.02;
                    movedDir.y += cos(uTime * 1.5 + aSize * 10.0) * 0.02;
                    
                    vec3 pos = movedDir * expPow * 1200.0;
                    
                    // White particles that get slightly cooler/dimmer as they expand
                    vec3 tWhite = vec3(1.0, 1.0, 1.0);
                    vec3 tDimWhite = vec3(0.8, 0.9, 1.0); 
                    vec3 color = mix(tWhite, tDimWhite, uCooling);
                    vColor = color * (1.5 + (1.0 - uCooling) * 5.0);
                    
                    // Twinkle effect based on uTime
                    float twinkle = sin(uTime * 5.0 + aSize * 100.0) * 0.5 + 0.5;
                    vAlpha = smoothstep(1.0, 0.0, expPow) * (0.7 + twinkle * 0.3);
                    
                    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = (4.0 + aSize * 15.0) * (1.0 - uCooling * 0.6) * (1000.0 / -mv.z);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                uniform sampler2D uMap; varying vec3 vColor; varying float vAlpha;
                void main() { 
                    vec4 tex = texture2D(uMap, gl_PointCoord);
                    gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha); 
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });

        this.plasma = new THREE.Points(geo, this.plasmaMat);
        this.plasmaGroup.add(this.plasma);
        this.group.add(this.plasmaGroup);
    }

    _initCosmicWeb(bgTex) {
        this.webGroup = new THREE.Group();
        if (bgTex) {
            bgTex.mapping = THREE.EquirectangularReflectionMapping;
            bgTex.colorSpace = THREE.SRGBColorSpace;
        }
        this.skySphere = new THREE.Mesh(
            new THREE.SphereGeometry(2500, 64, 64),
            new THREE.MeshBasicMaterial({ map: bgTex, color: 0x3366cc, side: THREE.BackSide, depthWrite: false, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
        );
        this.webGroup.add(this.skySphere);

        const starCount = 120000;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        const starCols = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            const r = 500 + Math.pow(Math.random(), 3) * 1500;
            const th = 2 * Math.PI * Math.random(); const ph = Math.acos(2 * Math.random() - 1);
            starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
            starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
            starPos[i * 3 + 2] = r * Math.cos(ph);
            // Mavimsi tonlar (Deep Blue, Cyan, White)
            const c = (Math.random() > 0.5) ? new THREE.Color(0x4488ff) : (Math.random() > 0.8 ? new THREE.Color(0x22ffff) : new THREE.Color(0xaaccff));
            starCols[i * 3] = c.r; starCols[i * 3 + 1] = c.g; starCols[i * 3 + 2] = c.b;
            starSizes[i] = 0.5 + Math.random();
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starCols, 3));
        starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));

        this.webStarsMat = new THREE.ShaderMaterial({
            uniforms: { uReveal: { value: 0 }, uTime: { value: 0 } },
            vertexShader: `
                uniform float uReveal; uniform float uTime; attribute vec3 color; attribute float aSize; varying vec3 vColor; varying float vBlink;
                void main() { 
                    vColor = color; vBlink = sin(uTime * 2.0 + aSize * 100.0) * 0.5 + 0.5;
                    vec4 mv = modelViewMatrix * vec4(position, 1.0); 
                    gl_PointSize = (4.0 * (1.0-uReveal) + 1.5 * aSize) * (800.0 / -mv.z); 
                    gl_Position = projectionMatrix * mv; 
                }
            `,
            fragmentShader: `
                uniform float uReveal; varying vec3 vColor; varying float vBlink;
                void main() { 
                    float d = length(gl_PointCoord - 0.5); float core = exp(-d * 10.0); 
                    gl_FragColor = vec4(vColor * core * (1.5 + vBlink), core * uReveal * smoothstep(0.0, 0.1, uReveal)); 
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.webStars = new THREE.Points(starGeo, this.webStarsMat);
        this.webStars.renderOrder = -1; // Render behind the sun
        this.webGroup.add(this.webStars);
        this.group.add(this.webGroup);
    }

    _initProtoSolarSystem() {
        this.solarGroup = new THREE.Group();
        this.sunGroup = new THREE.Group();
        this.sunGroup.position.set(0, 0, -400);

        const sunGeo = new THREE.SphereGeometry(45, 128, 128);
        this.sunMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
            vertexShader: `
                varying vec3 vPos; varying vec3 vNormal;
                void main() { 
                    vPos = position; vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
                }
            `,
            fragmentShader: `
                uniform float uTime; uniform float uReveal; varying vec3 vPos; varying vec3 vNormal;
                float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9, 78.2, 45.1))) * 43758.5); }
                float noise(vec3 p) {
                    vec3 i = floor(p); vec3 f = fract(p); vec3 u = f*f*(3.0-2.0*f);
                    return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), u.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), u.x), u.y),
                               mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), u.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), u.x), u.y), u.z);
                }
                void main() {
                    float n = noise(vPos * 0.1 + uTime * 0.5) * 0.5 + noise(vPos * 0.2 - uTime * 0.3) * 0.3;
                    vec3 colHot = vec3(1.0, 1.0, 0.9); vec3 colWarm = vec3(1.0, 0.5, 0.0); vec3 colRed = vec3(0.5, 0.1, 0.0);
                    float fresnel = pow(1.0 - dot(vNormal, vec3(0,0,1)), 3.0);
                    vec3 color = mix(colHot, colWarm, n + fresnel * 0.4);
                    color = mix(color, colRed, smoothstep(0.4, 1.0, n));
                    gl_FragColor = vec4(color * 5.0 * uReveal, uReveal);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending
        });
        this.sun = new THREE.Mesh(sunGeo, this.sunMat);
        this.sun.renderOrder = 1;
        this.sunGroup.add(this.sun);

        this.sunCorona = new THREE.Mesh(
            new THREE.SphereGeometry(65, 64, 64),
            new THREE.MeshBasicMaterial({ color: 0xff8822, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false })
        );
        this.sunCorona.renderOrder = 0;
        this.sunGroup.add(this.sunCorona);
        this.sunLight = new THREE.PointLight(0xfff5ee, 0, 6000);
        this.solarGroup.add(this.sunLight);

        const earthGeo = new THREE.SphereGeometry(7.5, 128, 128);
        this.earthMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uInteract: { value: 0 } },
            vertexShader: `
                varying vec2 vUv; varying vec3 vNormal;
                void main() {
                    vUv = uv; vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime; uniform float uReveal; uniform float uInteract;
                varying vec2 vUv; varying vec3 vNormal;
                float hash(vec2 p) { return fract(sin(dot(p, vec2(12.98, 78.23))) * 43758.54); }
                float noise(vec2 p) {
                    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
                    return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x), mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
                }
                float fbm(vec2 p) {
                    float v = 0.0; float a = 0.5;
                    for (int i=0; i<6; ++i) { v += a * noise(p); p = p * 2.1; a *= 0.5; }
                    return v;
                }
                void main() {
                    float m = fbm(vUv * 12.0 + uTime * 0.05);
                    float fissure = smoothstep(0.35 - uInteract*0.2, 0.65 + uInteract*0.2, m);
                    vec3 lava = vec3(1.0, 0.25, 0.05) * (6.0 * (1.1 - fissure)) * (1.0 + uInteract * 4.0);
                    vec3 rock = vec3(0.05, 0.03, 0.02);
                    vec3 final = mix(lava, rock, fissure);
                    float fresnel = pow(1.0 - max(0.0, dot(vNormal, vec3(0,0,1))), 3.0);
                    final += vec3(1.0, 0.4, 0.1) * fresnel * 0.8 * uReveal;
                    gl_FragColor = vec4(final * uReveal, uReveal);
                }
            `,
            transparent: true, depthWrite: true // Fixed sorting
        });
        this.earthMesh = new THREE.Mesh(earthGeo, this.earthMat);
        this.earthMesh.renderOrder = 2;
        this.solarGroup.add(this.earthMesh);
        this.solarGroup.add(this.sunGroup);
        this.group.add(this.solarGroup);
    }

    _initCinematicFlares() {
        this.flareMat = new THREE.ShaderMaterial({
            uniforms: { uIntensity: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float uIntensity; uniform vec3 uColor; varying vec2 vUv;
                void main() {
                    float gl = smoothstep(0.1, 0.0, abs(vUv.y - 0.5));
                    float sideFade = smoothstep(0.5, 0.0, abs(vUv.x - 0.5)) * smoothstep(0.0, 0.2, abs(vUv.x - 0.5));
                    float final = gl * sideFade * uIntensity;
                    gl_FragColor = vec4(uColor * final, final * 0.5);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.flare = new THREE.Mesh(new THREE.PlaneGeometry(3000, 10), this.flareMat);
        this.flare.renderOrder = 3;
        this.group.add(this.flare);
    }

    update(progress, time, delta, mouse) {
        if (!this.active || !this.initialized) return;

        const ph1 = Math.min(1.0, progress / 0.18);
        const ph2 = Math.max(0, Math.min(1.0, (progress - 0.18) / 0.27));
        const ph3 = Math.max(0, Math.min(1.0, (progress - 0.45) / 0.25));
        const ph4 = Math.max(0, Math.min(1.0, (progress - 0.70) / 0.30));

        this.camera.position.z = 165 - (progress * 135);
        this.mousePos.lerp(new THREE.Vector2(mouse.normalizedX, mouse.normalizedY), 0.1);

        if (ph1 < 1.0) {
            this.singularityGroup.visible = true; this.plasmaGroup.visible = false;
            this.webGroup.visible = false; this.solarGroup.visible = false;
            const flash = Math.pow(ph1, 12.0);
            this.coreMat.uniforms.uIntensity.value = 1.0 + flash * 25.0;
            const singularityIntensity = 1.0 + flash * 25.0;
            const aBoost = flash * 10.0; // Additional boost for animations during flash
            this.singularityLight.intensity = flash * 35000.0;

            // High-octane initial core animations
            this.coreMat.uniforms.uTime.value = time * 2.0;
            this.coreMat.uniforms.uIntensity.value = singularityIntensity;
            this.singularityPoint.rotation.y = time * 0.3;
            this.singularityPoint.rotation.x = time * 0.15;
            this.singularityPoint.scale.setScalar(1.0 + flash * 5.0); // Expand greatly before burst

            // Pulsing halo
            this.haloMat.uniforms.uTime.value = time;
            this.haloMat.uniforms.uIntensity.value = singularityIntensity * (1.0 + Math.sin(time * 3.0) * 0.1 + (aBoost * 2.0));

            // Chaotic tendrils and accretion rings
            this.particlesGroup.rotation.y = time * 0.1;
            this.particlesGroup.rotation.z = Math.sin(time * 0.05) * 0.2;

            for (const t of this.tendrils) {
                t.mesh.rotateOnAxis(t.axis, t.speed * delta);
                if (t.isLightning) {
                    // Eratic flickering for lightning tendrils
                    t.mesh.material.opacity = t.baseOpacity * singularityIntensity * Math.pow(Math.random(), 2.0) * (2.0 + aBoost * 3.0);
                } else {
                    // Smooth pulsing for accretion rings
                    t.mesh.material.opacity = t.baseOpacity * singularityIntensity * (1.0 + Math.sin(time * t.speed + t.speed) * 0.5) * (1.0 + aBoost);
                }
                t.mesh.position.lerp(new THREE.Vector3(this.mousePos.x * 5, this.mousePos.y * 5, 0), 0.05);
            }
            this.flareMat.uniforms.uIntensity.value = flash * 350.0;
            this.flare.position.z = this.camera.position.z - 10;
            this.camera.lookAt(0, 0, 0);
        }
        else if (ph2 < 1.0) {
            this.singularityGroup.visible = true; // Keep for shockwave
            this.singularityPoint.visible = false;
            this.plasmaGroup.visible = true;
            this.shockwave.visible = true;
            this.shockwave.scale.setScalar(ph2 * 500);
            this.shockwaveMat.uniforms.uReveal.value = ph2;
            this.plasmaMat.uniforms.uTime.value = time; this.plasmaMat.uniforms.uExpansion.value = ph2;
            this.plasmaMat.uniforms.uCooling.value = Math.pow(ph2, 0.6);
            this.flareMat.uniforms.uIntensity.value = (1.0 - ph2) * 200.0;
            this.camera.lookAt(0, 0, 0);
            if (ph2 < 0.2) {
                this.camera.position.x += (Math.random() - 0.5) * (0.2 - ph2) * 25.0;
                this.camera.position.y += (Math.random() - 0.5) * (0.2 - ph2) * 25.0;
            }
        }
        else if (ph3 < 1.0) {
            this.singularityGroup.visible = false; this.plasmaGroup.visible = false;
            this.webGroup.visible = true; this.skySphere.material.opacity = ph3 * 0.5;
            this.webStarsMat.uniforms.uReveal.value = ph3; this.webStarsMat.uniforms.uTime.value = time;
            this.webGroup.rotation.y = time * 0.01;
            this.camera.lookAt(0, 0, -400);
        }
        else {
            this.webGroup.visible = true; this.solarGroup.visible = true;

            // INCREASE BACKGROUND QUALITY DURING PHASE 4
            this.skySphere.material.opacity = 0.6 + ph4 * 0.4;
            this.webStarsMat.uniforms.uReveal.value = 1.0 + ph4 * 0.8;

            // Ensure uReveal is passed down for transparency fixes
            this.sunMat.uniforms.uReveal.value = ph4; this.sunMat.uniforms.uTime.value = time;
            this.earthMat.uniforms.uReveal.value = ph4;

            this.sunCorona.material.opacity = ph4 * 0.4; this.sunLight.intensity = ph4 * 30000.0;

            // Simple, stable orbit for the small planet
            const orbitDist = 90.0;
            // time scaling makes it slowly rotate around the sun
            const orbitAngle = time * 0.2;
            const sunPt = this.sunGroup.position;

            this.earthMesh.position.set(
                sunPt.x + Math.sin(orbitAngle) * orbitDist,
                sunPt.y + Math.sin(time * 1.5) * 8.0, // slight bobbing
                sunPt.z + Math.cos(orbitAngle) * orbitDist
            );

            // Clean lighting flare + INITIAL BURST / FLASH
            this.flareMat.uniforms.uColor.value.setHex(0xffffff);
            const transitionFlash = Math.pow(1.0 - ph4, 8.0) * 800.0; // massive white flash that quickly fades
            this.flareMat.uniforms.uIntensity.value = ph4 * 15.0 + transitionFlash;
            this.flare.position.copy(this.sunGroup.position).add(new THREE.Vector3(0, 0, 50));

            // --- CINEMATIC SMOOTH CAMERA ---
            // Revolve the camera around the solar system to see the earth orbiting.
            const camOrbitSpeed = time * 0.1;

            // Exponentially zoom DEEP into the sun as the phase ends to transition
            const zoomFactor = Math.pow(ph4, 4.0);
            const startRadius = 150.0;
            const endRadius = -40.0; // Plunge literally through the sun
            const camRadius = startRadius * (1.0 - zoomFactor) + endRadius * zoomFactor;

            // Orbit position
            const targetCamX = Math.sin(camOrbitSpeed) * camRadius + this.mousePos.x * 30.0 * (1.0 - zoomFactor);
            const targetCamY = Math.cos(camOrbitSpeed * 0.5) * 40.0 * (1.0 - zoomFactor) + this.mousePos.y * 25.0 * (1.0 - zoomFactor); // Center Y as we zoom
            const targetCamZ = Math.cos(camOrbitSpeed) * camRadius;

            this.camera.position.x += (targetCamX - this.camera.position.x) * 0.03;
            this.camera.position.y += (targetCamY - this.camera.position.y) * 0.03;
            this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.03;

            // Fluidly look slightly past the sun toward the earth, but snap to sun center exactly as we plunge in.
            const lookTarget = new THREE.Vector3().copy(sunPt).lerp(this.earthMesh.position, 0.4 * (1.0 - zoomFactor));
            lookTarget.y -= this.mousePos.y * 10.0 * (1.0 - zoomFactor);
            this.camera.lookAt(lookTarget);

            // AGGRESSIVE CAMERA SHAKE (Scroll ile artan patlama hissiyatı)
            // Starts small, and grows exponentially as we near the scene change (ph4 -> 1.0)
            const shakeIntensity = Math.pow(ph4, 4.0) * 18.0;
            this.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.z += (Math.random() - 0.5) * shakeIntensity * 0.5;
        }
    }

    deactivate() { this.active = false; }
    dispose() { this.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); }
}
