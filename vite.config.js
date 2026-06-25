import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'pages/game.html'),
        leaderboard: resolve(__dirname, 'pages/leaderboard.html'),
      },
    },
  },
});
