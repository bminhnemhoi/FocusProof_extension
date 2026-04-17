import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// FocusProof v1.1 — Web (Pricing + Landing)
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        open: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
