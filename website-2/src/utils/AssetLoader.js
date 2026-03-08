// ============================================
// ASSET LOADER — Centralized loading with progress
// ============================================
import * as THREE from 'three';

export class AssetLoader {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.loadingManager = new THREE.LoadingManager();
        this.assets = {};
        this._totalItems = 0;
        this._loadedItems = 0;
        this._progressCallback = null;
    }

    onProgress(callback) {
        this._progressCallback = callback;
    }

    _updateProgress() {
        this._loadedItems++;
        const progress = this._totalItems > 0 ? this._loadedItems / this._totalItems : 1;
        if (this._progressCallback) {
            this._progressCallback(progress);
        }
    }

    /**
     * Queue a texture to load
     */
    async loadTexture(name, url) {
        this._totalItems++;
        return new Promise((resolve) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    this.assets[name] = texture;
                    this._updateProgress();
                    resolve(texture);
                },
                undefined,
                () => {
                    console.warn(`Failed to load texture: ${name} (${url})`);
                    this._updateProgress();
                    resolve(null);
                }
            );
        });
    }

    /**
     * Create a procedural texture (avoids loading)
     */
    createGradientTexture(name, color1, color2, size = 512) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        const texture = new THREE.CanvasTexture(canvas);
        this.assets[name] = texture;
        return texture;
    }

    /**
     * Create a simple glow/star sprite texture
     */
    createGlowTexture(name, color = '#ffffff', size = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(0.4, `${color}88`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        const texture = new THREE.CanvasTexture(canvas);
        this.assets[name] = texture;
        return texture;
    }

    get(name) {
        return this.assets[name] || null;
    }

    dispose() {
        Object.values(this.assets).forEach(asset => {
            if (asset && asset.dispose) asset.dispose();
        });
        this.assets = {};
    }
}
