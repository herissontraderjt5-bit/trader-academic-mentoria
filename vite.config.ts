import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'signal-bot-config-api',
        configureServer(server) {
          server.middlewares.use('/api/signal-bot-config', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  fs.writeFileSync(path.resolve(__dirname, 'server/signalBotConfig.json'), body);
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true }));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
            } else if (req.method === 'GET') {
              try {
                const data = fs.readFileSync(path.resolve(__dirname, 'server/signalBotConfig.json'), 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
              } catch (e) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Not found' }));
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/hiove-broker': {
          target: 'https://broker-api.mybrokerdev.com',
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/hiove-broker/, ''),
        },
        '/api/hiove-userbots': {
          target: 'https://userbots.hiove.io',
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/hiove-userbots/, ''),
        },
      },
    },
  };
});
