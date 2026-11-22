import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function readPublishedGames(rootDir) {
  const manifestPath = path.join(rootDir, 'games.json');
  if (!fs.existsSync(manifestPath)) return [];
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  return (raw.games || []).filter((g) => g.published !== false && g.folder);
}

function copyDirFiltered(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '.DS_Store' || entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirFiltered(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Serves only games listed in games.json under /games/<folder>/ during dev,
 * and bundles only those published game folders into dist/games/<folder>/ on build.
 * Unlisted folders in the workspace are never exposed or deployed.
 */
function deficitGamesPlugin() {
  let rootDir = process.cwd();
  let outDir = 'dist';
  let isBuild = false;

  return {
    name: 'deficit-games-bundler',
    configResolved(config) {
      rootDir = config.root;
      outDir = config.build.outDir;
      isBuild = config.command === 'build';
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = (req.url || '/').split('?')[0];
        if (!cleanUrl.startsWith('/games/')) return next();

        const parts = cleanUrl.slice('/games/'.length).split('/').filter(Boolean);
        if (parts.length === 0) return next();

        const folder = parts[0];
        const published = readPublishedGames(rootDir);
        const game = published.find((g) => g.folder === folder);
        if (!game) {
          res.statusCode = 404;
          res.end('Game not found or not published in games.json');
          return;
        }

        const relPath = parts.slice(1).join('/') || game.entry || 'index.html';
        const gameRoot = path.resolve(rootDir, folder);
        const targetPath = path.resolve(gameRoot, relPath);

        if (!targetPath.startsWith(gameRoot)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        let fileToServe = targetPath;
        if (fs.existsSync(fileToServe) && fs.statSync(fileToServe).isDirectory()) {
          fileToServe = path.join(fileToServe, 'index.html');
        }

        if (!fs.existsSync(fileToServe) || !fs.statSync(fileToServe).isFile()) {
          return next();
        }

        const ext = path.extname(fileToServe).toLowerCase();
        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        fs.createReadStream(fileToServe).pipe(res);
      });
    },
    closeBundle() {
      if (!isBuild) return;
      const published = readPublishedGames(rootDir);
      const distGamesRoot = path.resolve(rootDir, outDir, 'games');
      for (const game of published) {
        const srcFolder = path.resolve(rootDir, game.folder);
        if (!fs.existsSync(srcFolder)) {
          console.warn(`[deficit-games] Warning: folder "${game.folder}" not found, skipping.`);
          continue;
        }
        const destFolder = path.join(distGamesRoot, game.folder);
        copyDirFiltered(srcFolder, destFolder);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), deficitGamesPlugin()],
});
