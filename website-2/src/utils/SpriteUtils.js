// ============================================
// SPRITE UTILS — Shared circular particle textures
// ============================================
import * as THREE from 'three';

/**
 * Creates a circular glow particle texture (canvas-based)
 */
export function createCircleTexture(color = '#ffffff', size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);

    // Always use a white gradient and let Three.js multiply the color
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Creates a sharp circle sprite (no glow, hard edge)
 */
export function createDotTexture(size = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const half = size / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(half, half, half * 0.85, 0, Math.PI * 2);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Creates a PointsMaterial with circular rendering
 */
export function createParticleMaterial(options = {}) {
    const tex = options.glowTexture || createCircleTexture('#ffffff', 64);
    return new THREE.PointsMaterial({
        size: options.size || 1,
        map: tex,
        vertexColors: options.vertexColors !== false,
        transparent: true,
        opacity: options.opacity !== undefined ? options.opacity : 1,
        blending: options.blending || THREE.AdditiveBlending,
        sizeAttenuation: options.sizeAttenuation !== false,
        depthWrite: false,
        alphaTest: 0.01,
        color: options.color || undefined,
    });
}
