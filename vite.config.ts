import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        collisionEditor: path.resolve(__dirname, 'collision-editor.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: [
      '@babylonjs/core',
      '@babylonjs/gui',
      '@babylonjs/loaders',
      '@babylonjs/materials',
      '@babylonjs/core/Engines/engine',
      '@babylonjs/core/scene',
      '@babylonjs/gui/2D'
    ],
    exclude: ['@babylonjs/havok']
  }
});