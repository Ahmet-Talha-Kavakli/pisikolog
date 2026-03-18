// ============================================
// PARTICLE SYSTEM — Reusable GPU Particle Engine
// ============================================
import * as THREE from 'three';

export class ParticleSystem {
    constructor(count, options = {}) {
        this.count = count;
        this.options = {
            size: options.size || 1,
            color: options.color || new THREE.Color(1, 1, 1),
            opacity: options.opacity !== undefined ? options.opacity : 1,
            blending: options.blending || THREE.AdditiveBlending,
            sizeAttenuation: options.sizeAttenuation !== undefined ? options.sizeAttenuation : true,
            depthWrite: options.depthWrite || false,
            vertexColors: options.vertexColors || false,
            texture: options.texture || null,
        };

        this.positions = new Float32Array(count * 3);
        this.velocities = new Float32Array(count * 3);
        this.colors = new Float32Array(count * 3);
        this.sizes = new Float32Array(count);
        this.lifetimes = new Float32Array(count);
        this.ages = new Float32Array(count);

        this._init();
    }

    _init() {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

        const matOpts = {
            size: this.options.size,
            transparent: true,
            opacity: this.options.opacity,
            blending: this.options.blending,
            sizeAttenuation: this.options.sizeAttenuation,
            depthWrite: this.options.depthWrite,
            vertexColors: this.options.vertexColors,
        };

        if (this.options.texture) {
            matOpts.map = this.options.texture;
        }

        const mat = new THREE.PointsMaterial(matOpts);
        if (!this.options.vertexColors) {
            mat.color = this.options.color;
        }

        this.geometry = geo;
        this.material = mat;
        this.points = new THREE.Points(geo, mat);
    }

    /**
     * Distribute particles in a sphere
     */
    distributeInSphere(radius, center = { x: 0, y: 0, z: 0 }) {
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            const r = radius * Math.cbrt(Math.random());
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            this.positions[i3] = center.x + r * Math.sin(phi) * Math.cos(theta);
            this.positions[i3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta);
            this.positions[i3 + 2] = center.z + r * Math.cos(phi);
            this.sizes[i] = this.options.size * (0.5 + Math.random() * 0.5);
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
    }

    /**
     * Distribute particles in a spiral galaxy shape
     */
    distributeInSpiral(radius, arms = 4, turns = 3, spread = 0.5) {
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            const arm = Math.floor(Math.random() * arms);
            const t = Math.random();
            const r = t * radius;
            const angle = t * turns * Math.PI * 2 + (arm * Math.PI * 2) / arms;
            const spreadX = (Math.random() - 0.5) * spread * r;
            const spreadY = (Math.random() - 0.5) * spread * 0.15 * r;
            const spreadZ = (Math.random() - 0.5) * spread * r;

            this.positions[i3] = Math.cos(angle) * r + spreadX;
            this.positions[i3 + 1] = spreadY;
            this.positions[i3 + 2] = Math.sin(angle) * r + spreadZ;

            // Color based on distance
            const distRatio = r / radius;
            const col = new THREE.Color();
            col.setHSL(0.6 + distRatio * 0.15, 0.6 + distRatio * 0.3, 0.4 + distRatio * 0.4);
            this.colors[i3] = col.r;
            this.colors[i3 + 1] = col.g;
            this.colors[i3 + 2] = col.b;

            this.sizes[i] = this.options.size * (0.3 + Math.random() * 0.7) * (1 - distRatio * 0.5);
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
    }

    /**
     * Morph particle positions from current to target over t [0,1]
     */
    morph(targetPositions, t) {
        const eased = t * t * (3 - 2 * t); // smoothstep
        for (let i = 0; i < this.count * 3; i++) {
            const origin = this._morphOriginPositions ? this._morphOriginPositions[i] : 0;
            this.positions[i] = origin + (targetPositions[i] - origin) * eased;
        }
        this.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Save current positions as morph origin
     */
    saveMorphOrigin() {
        this._morphOriginPositions = new Float32Array(this.positions);
    }

    /**
     * Set particle colors
     */
    setColors(colorStart, colorEnd) {
        const c1 = new THREE.Color(colorStart);
        const c2 = new THREE.Color(colorEnd);
        for (let i = 0; i < this.count; i++) {
            const t = Math.random();
            const c = c1.clone().lerp(c2, t);
            this.colors[i * 3] = c.r;
            this.colors[i * 3 + 1] = c.g;
            this.colors[i * 3 + 2] = c.b;
        }
        this.geometry.attributes.color.needsUpdate = true;
    }

    update(delta) {
        // Override in subclass or set custom update fn
    }

    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        if (this.material.map) this.material.map.dispose();
    }
}

// Starfield — simple background star particles
export class Starfield extends ParticleSystem {
    constructor(count = 5000, radius = 500) {
        super(count, {
            size: 1.5,
            color: new THREE.Color(0xffffff),
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            vertexColors: true,
        });
        this.distributeInSphere(radius);
        this.setColors('#ffffff', '#aabbff');
        // Twinkle state
        this._twinklePhases = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            this._twinklePhases[i] = Math.random() * Math.PI * 2;
        }
    }

    update(time) {
        for (let i = 0; i < this.count; i++) {
            const phase = this._twinklePhases[i];
            this.sizes[i] = this.options.size * (0.5 + 0.5 * Math.sin(time * 1.5 + phase));
        }
        this.geometry.attributes.size.needsUpdate = true;
    }
}
