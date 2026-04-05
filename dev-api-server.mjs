#!/usr/bin/env node
/**
 * Local dev API server for SHARIEL
 * Handles /api/chat and /api/engine endpoints
 */

import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { processUserMessage } from './src/bot/engine.js';
import chatHandler from './api/chat.js';

// Load .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    env.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value.length > 0) {
        process.env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
      }
    });
    console.log('✅ Loaded .env.local');
  }
} catch (e) {
  console.error('❌ Failed to load .env.local:', e.message);
}

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse request body
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname;

      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      // 1. TRIZ Engine (/engine or /api/engine)
      if (pathname === '/engine' || pathname === '/api/engine') {
        const data = JSON.parse(body || '{}');
        const { userMessage, task, state, history, ageGroup } = data;

        if (!userMessage || !task || !state) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing required fields (userMessage, task, state)' }));
          return;
        }

        try {
          const age = ageGroup === 'junior' ? 8 : 14;
          const result = await processUserMessage(userMessage, task, state, history || [], null, age);
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[engine error]', err.message);
          res.writeHead(500);
          res.end(JSON.stringify({
            error: 'Engine failed',
            reply: 'Дракон запутался в мыслях. Попробуй ещё раз!',
            newState: state
          }));
        }
        return;
      }

      // 2. Chat / AI (/chat or /api/chat)
      if (pathname === '/chat' || pathname === '/api/chat') {
        const data = JSON.parse(body || '{}');
        const mockReq = { method: 'POST', body: data, headers: req.headers };
        const mockRes = {
          status: (code) => ({
            json: (payload) => { res.writeHead(code); res.end(JSON.stringify(payload)); },
            end: () => { res.writeHead(code); res.end(); }
          }),
          setHeader: () => {}
        };
        try {
          await chatHandler(mockReq, mockRes);
        } catch (err) {
          console.error('[chat handler error]', err.message);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Chat failed', text: 'Ошибка ИИ.' }));
        }
        return;
      }

      // 3. Save Tasks (/api/save-tasks)
      if (pathname === '/save-tasks' || pathname === '/api/save-tasks') {
        const data = JSON.parse(body || '{}');
        const tasks = data.tasks;
        if (!Array.isArray(tasks)) {
           res.writeHead(400); res.end(JSON.stringify({ error: 'Tasks must be an array' })); return;
        }
        const filePath = path.resolve(process.cwd(), 'src', 'tasks.js');
        const content = `export const TASKS = ${JSON.stringify(tasks, null, 2)};\n`;
        fs.writeFileSync(filePath, content, 'utf-8');
        res.writeHead(200); res.end(JSON.stringify({ success: true }));
        return;
      }

      // 4. Save Image (/api/save-image)
      if (pathname === '/save-image' || pathname === '/api/save-image') {
        const data = JSON.parse(body || '{}');
        const { filename, base64 } = data;
        if (!filename || !base64) {
           res.writeHead(400); res.end(JSON.stringify({ error: 'Missing filename or base64' })); return;
        }
        
        // Remove data URI prefix
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
        const uploadDir = path.resolve(process.cwd(), 'public', 'assets', 'tasks');
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.resolve(uploadDir, filename);
        fs.writeFileSync(filePath, base64Data, 'base64');
        
        res.writeHead(200); 
        res.end(JSON.stringify({ success: true, url: `/assets/tasks/${filename}` }));
        return;
      }

      // 5. Save Island Mapping (/api/save-island-mapping)
      if (pathname === '/save-island-mapping' || pathname === '/api/save-island-mapping') {
        const data = JSON.parse(body || '{}');
        const { mapping } = data;
        if (!mapping || typeof mapping !== 'object') {
           res.writeHead(400); res.end(JSON.stringify({ error: 'mapping required' })); return;
        }
        const filePath = path.resolve(process.cwd(), 'src', 'utils', 'gameUtils.js');
        let content = fs.readFileSync(filePath, 'utf-8');
        // Replace ISLAND_MAPPING block
        const newMapping = `export const ISLAND_MAPPING = ${JSON.stringify(mapping, null, 2)};`;
        content = content.replace(/export const ISLAND_MAPPING = \{[\s\S]*?\};/, newMapping);
        fs.writeFileSync(filePath, content, 'utf-8');
        res.writeHead(200); res.end(JSON.stringify({ success: true }));
        return;
      }

      // Default 404
      console.log('404 Not Found:', pathname);
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'API route not found: ' + pathname }));

    } catch (err) {
      console.error('Server error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Server internal error' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Dev API Server running on http://localhost:${PORT}`);
  console.log(`   - /api/engine (TRIZ)`);
  console.log(`   - /api/chat (AI Companion)\n`);
});
