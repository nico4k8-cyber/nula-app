import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
let PINECONE_API_KEY, PINECONE_INDEX_HOST;
for (const line of envContent.split('\n')) {
  const [k, ...rest] = line.split('=');
  const v = rest.join('=').trim();
  if (k === 'PINECONE_API_KEY') PINECONE_API_KEY = v;
  if (k === 'PINECONE_INDEX_HOST') PINECONE_INDEX_HOST = v;
}

async function test(text, taskId) {
  const embedRes = await fetch('https://api.pinecone.io/embed', {
    method: 'POST',
    headers: { 'Api-Key': PINECONE_API_KEY, 'Content-Type': 'application/json', 'X-Pinecone-Api-Version': '2025-10' },
    body: JSON.stringify({ model: 'multilingual-e5-large', inputs: [{ text }], parameters: { input_type: 'query', truncate: 'END' } })
  });
  const embedData = await embedRes.json();
  const vector = embedData.data[0].values;
  const queryRes = await fetch(`https://${PINECONE_INDEX_HOST}/query`, {
    method: 'POST',
    headers: { 'Api-Key': PINECONE_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vector, topK: 5, includeMetadata: true, filter: { taskId: { $in: [taskId, '_all'] } } })
  });
  const queryData = await queryRes.json();
  console.log(`Input: "${text}" (task: ${taskId})`);
  for (const m of (queryData.matches || []).slice(0, 5)) {
    console.log(`  ${m.score.toFixed(3)} ${m.metadata.matchType.padEnd(10)} ${m.metadata.branchId.padEnd(10)} | ${m.metadata.text}`);
  }
  console.log();
}

// Test bag-related phrases
await test('хочу убрать сумку', 'bags');
await test('убрать сумку чтобы нечего было хватать', 'bags');
await test('спрятать сумку', 'bags');
await test('если не будет сумки то и воровать нечего', 'bags');
await test('можно вывести из строя машину', 'bags');
await test('запретить мотоциклы', 'bags');
