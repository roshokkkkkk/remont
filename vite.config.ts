import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // Все запросы на /api/* Vite будет пересылать на ваш Express-сервер
      '/api': 'http://localhost:3000' // ← замените 3000 на порт из server.js
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        // Если в папке pages лежат отдельные HTML-страницы, добавьте их сюда:
        // page2: path.resolve(__dirname, 'pages/catalog.html'),
        // page3: path.resolve(__dirname, 'pages/contacts.html'),
      }
    }
  }
});