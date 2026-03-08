// ============================================
// POST PROCESSING — CINEMATIC V4.4 (PREMIUM STABILITY)
// ACES FILMIC TONEMAPPING + NUCLEAR ISOLATION
// ============================================
import * as THREE from 'three';
import {
    EffectComposer, RenderPass, EffectPass, BloomEffect,
    ChromaticAberrationEffect, VignetteEffect, NoiseEffect, DepthOfFieldEffect,
    SMAAEffect, ToneMappingEffect, ToneMappingMode, BlendFunction, KernelSize
} from 'postprocessing';

export class PostProcessingPipeline {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // Ensure renderer doesn't fight with our ToneMappingEffect
        renderer.toneMapping = THREE.NoToneMapping;

        this.composer = new EffectComposer(renderer, {
            frameBufferType: THREE.HalfFloatType
        });

        this.composer.addPass(new RenderPass(scene, camera));

        // 1. Core Visual Effects
        this.smaa = new SMAAEffect();
        this.bloom = new BloomEffect({
            intensity: 0.8,
            luminanceThreshold: 0.4,
            luminanceSmoothing: 0.5,
            kernelSize: KernelSize.MEDIUM,
            mipmapBlur: true,
        });

        this.chromatic = new ChromaticAberrationEffect({
            offset: new THREE.Vector2(0.0004, 0.0004)
        });

        this.noise = new NoiseEffect({
            blendFunction: BlendFunction.SOFT_LIGHT,
            premultiply: true,
        });
        this.noise.blendMode.opacity.value = 0.01;

        this.vignette = new VignetteEffect({ darkness: 0.35, offset: 0.4 });

        this.dof = new DepthOfFieldEffect(camera, {
            focusDistance: 0.1,
            focalLength: 0.05,
            bokehScale: 1.5,
            height: 1080
        });

        // 2. ACES Filmic Tone Mapping (Crucial to fix black hole artifacts)
        this.toneMapping = new ToneMappingEffect({
            mode: ToneMappingMode.ACES_FILMIC,
            resolution: 256,
            whitePoint: 1.0,
            middleGrey: 0.6,
            averageLuminance: 1.0,
            adaptationRate: 1.0
        });

        // 3. NUCLEAR ISOLATION ARCHITECTURE
        // We use individual passes to ensure NO shader merging errors occur.
        this.composer.addPass(new EffectPass(camera, this.dof));
        this.composer.addPass(new EffectPass(camera, this.bloom));
        this.composer.addPass(new EffectPass(camera, this.smaa));
        this.composer.addPass(new EffectPass(camera, this.chromatic));
        this.composer.addPass(new EffectPass(camera, this.toneMapping));
        this.composer.addPass(new EffectPass(camera, this.vignette, this.noise));
    }

    setPreset(preset) {
        let targets = {};
        switch (preset) {
            case 'bigbang': targets = { bI: 1.0, bL: 0.3, cO: 0.0008, vD: 0.5, nO: 0.03, dof: 0, fD: 0.1 }; break;
            case 'space': targets = { bI: 0.5, bL: 0.5, cO: 0.0002, vD: 0.4, nO: 0.01, dof: 0, fD: 0.1 }; break;
            case 'saturn': targets = { bI: 0.8, bL: 0.4, cO: 0.0004, vD: 0.5, nO: 0.02, dof: 1.2, fD: 0.12 }; break;
            case 'earth': targets = { bI: 0.7, bL: 0.5, cO: 0.0002, vD: 0.45, nO: 0.015, dof: 0.8, fD: 0.2 }; break;
            case 'city': targets = { bI: 0.6, bL: 0.55, cO: 0.0003, vD: 0.55, nO: 0.04, dof: 2.0, fD: 0.15 }; break;
            case 'negative': targets = { bI: 0.3, bL: 0.8, cO: 0.003, vD: 0.7, nO: 0.08, dof: 4.0, fD: 0.02 }; break;
            case 'hope': targets = { bI: 1.8, bL: 0.25, cO: 0.0001, vD: 0.1, nO: 0.01, dof: 3.0, fD: 0.05 }; break;
            default: targets = { bI: 0.8, bL: 0.45, cO: 0.0004, vD: 0.4, nO: 0.015, dof: 0, fD: 0.1 };
        }

        import('gsap').then(({ default: gsap }) => {
            gsap.to(this.bloom, { intensity: targets.bI, duration: 1.0 });
            if (this.bloom.luminanceMaterial) gsap.to(this.bloom.luminanceMaterial, { threshold: targets.bL, duration: 1.0 });
            gsap.to(this.chromatic.offset, { x: targets.cO, y: targets.cO, duration: 1.0 });
            gsap.to(this.vignette, { darkness: targets.vD, duration: 1.0 });
            gsap.to(this.noise.blendMode.opacity, { value: targets.nO, duration: 1.0 });
            if (this.dof.cocMaterial) gsap.to(this.dof.cocMaterial, { focusDistance: targets.fD, duration: 1.0 });
            gsap.to(this.dof, { bokehScale: targets.dof, duration: 1.0 });
        });
    }

    render(delta) {
        this.composer.render(delta);
    }

    resize(w, h) {
        this.composer.setSize(w, h);
    }

    dispose() {
        this.composer.dispose();
    }
}
