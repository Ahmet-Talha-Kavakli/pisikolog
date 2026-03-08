// ============================================
// AUDIO MANAGER — Cinematic 3D Spatial Engine (Howler.js + Panner)
// HRTF-like Panning → Frequency Analyser → 3D Object Tracking
// ============================================
import { Howl, Howler } from 'howler';

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentAmbient = null;
        this.muted = false;
        this.masterVolume = 0.5;
        this._initialized = false;
        this.analyser = null;
        this.dataArray = null;
    }

    /**
     * Initialize Analyser & Audio Context (V4 God-Tier)
     */
    initAnalyser() {
        if (this.analyser) return;
        const ctx = Howler.ctx;
        if (!ctx) return;

        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 512;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);

        // Connect Howler master gain to our analyser for global frequency reactiveness
        if (Howler.masterGain) {
            Howler.masterGain.connect(this.analyser);
        }
    }

    /**
     * Get average frequency level (0.0 - 1.0)
     */
    getFrequencyLevel() {
        if (!this.analyser) return 0;
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / (this.dataArray.length * 255);
    }

    register(name, src, options = {}) {
        this.sounds[name] = {
            src,
            volume: options.volume || 0.5,
            loop: options.loop || false,
            spatial: options.spatial || false,
            howl: null,
        };
    }

    async loadAll() {
        const promises = Object.entries(this.sounds).map(([name, config]) => {
            return new Promise((resolve) => {
                config.howl = new Howl({
                    src: [config.src],
                    volume: config.volume * this.masterVolume,
                    loop: config.loop,
                    preload: true,
                    // Spatial options
                    pannerAttr: config.spatial ? {
                        coneInnerAngle: 360,
                        coneOuterAngle: 360,
                        coneOuterGain: 0,
                        distanceModel: 'inverse',
                        maxDistance: 1000,
                        panningModel: 'HRTF',
                        refDistance: 1,
                        rolloffFactor: 1,
                    } : null,
                    onload: () => resolve(name),
                    onloaderror: () => {
                        console.warn(`Audio fail: ${name}`);
                        resolve(name);
                    },
                });
            });
        });
        await Promise.all(promises);
        this._initialized = true;
    }

    /**
     * Update 3D Panning for a specific sound based on a 3D position
     */
    updatePosition(name, x, y, z) {
        const s = this.sounds[name];
        if (s?.howl && s.spatial) {
            s.howl.pos(x, y, z);
        }
    }

    /**
     * Update Global Listener (Camera Position)
     */
    updateListener(camera) {
        if (!camera) return;
        const pos = camera.position;
        Howler.pos(pos.x, pos.y, pos.z);
        // orientation is also possible but often overkill for web
    }

    play(name) {
        if (this.sounds[name]?.howl) {
            const id = this.sounds[name].howl.play();
            this.initAnalyser();
            return id;
        }
    }

    crossfadeAmbient(name, duration = 4000) {
        const newSound = this.sounds[name];
        if (!newSound?.howl) return;

        if (this.currentAmbient && this.sounds[this.currentAmbient]) {
            const current = this.sounds[this.currentAmbient].howl;
            current.fade(current.volume(), 0, duration);
            const old = this.currentAmbient;
            setTimeout(() => {
                if (this.sounds[old]?.howl) this.sounds[old].howl.stop();
            }, duration);
        }

        newSound.howl.volume(0);
        newSound.howl.play();
        newSound.howl.fade(0, newSound.volume * this.masterVolume, duration);
        this.currentAmbient = name;
        this.initAnalyser();
    }

    playSFX(name, options = {}) {
        const s = this.sounds[name];
        if (!s?.howl) return;
        const id = s.howl.play();
        s.howl.volume(s.volume * this.masterVolume * (options.volume || 1.0), id);

        if (options.pos) {
            s.howl.pos(options.pos.x, options.pos.y, options.pos.z, id);
        }

        this.initAnalyser();
        return id;
    }

    toggleMute() {
        this.muted = !this.muted;
        Howler.mute(this.muted);
        return this.muted;
    }

    setMasterVolume(vol) {
        this.masterVolume = vol;
        Howler.volume(vol);
    }
}
