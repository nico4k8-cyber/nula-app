#!/usr/bin/env node
/**
 * Local dev API server for testing
 * Handles /api/chat and /api/engine endpoints
 * Run: node dev-api-server.mjs
 */

import http from 'http';
import url from 'url';
import { processUserMessage, TASKS } from './src/bot/engine.js';

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
      const pathname = url.parse(req.url).pathname;

      // /api/engine — TRIZ 7-phase engine
      if (pathname === '/api/engine' && req.method === 'POST') {
        const data = JSON.parse(body);
        const { userMessage, task, state, history } = data;

        if (!userMessage || !task || !state) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing required fields' }));
          return;
        }

        try {
          const result = await processUserMessage(userMessage, task, state, history || []);
          res.writeHead(200);
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[engine]', err.message);
          res.writeHead(500);
          res.end(JSON.stringify({
            error: 'Engine processing failed',
            reply: 'Что-то пошло не так. Попробуй ещё раз.',
            newState: state,
            stars: 0
          }));
        }
        return;
      }

      // Default 404
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));

    } catch (err) {
      console.error('Server error:', err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Dev API Server running on http://localhost:${PORT}`);
  console.log(`   /api/engine — TRIZ 7-phase engine\n`);
});
