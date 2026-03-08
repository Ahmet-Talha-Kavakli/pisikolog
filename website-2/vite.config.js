import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
    plugins: [glsl()],
    assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
    build: {
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                    gsap: ['gsap'],
                },
            },
        },
    },
    server: {
        port: 5173,
        open: true,
    },
});
