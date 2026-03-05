/**
 * Полная настройка Pinecone: создание индекса + загрузка данных.
 *
 * Использование:
 *   node scripts/setup-pinecone.js
 *
 * API ключ берётся из файла .env.local (PINECONE_API_KEY=...)
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Читаем .env.local вручную (без dotenv)
const envPath = join(__dirname, '..', '.env.local');
let apiKey = process.env.PINECONE_API_KEY;

try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^PINECONE_API_KEY=(.+)$/);
    if (match) apiKey = match[1].trim();
  }
} catch (e) {
  // .env.local not found, rely on env var
}

if (!apiKey || apiKey === 'ВСТАВЬТЕ_СЮДА_ВАШ_КЛЮЧ') {
  console.error('❌ Откройте файл .env.local и вставьте ваш Pinecone API ключ');
  console.error('   Замените ВСТАВЬТЕ_СЮДА_ВАШ_КЛЮЧ на ваш ключ (начинается с pcsk_...)');
  process.exit(1);
}

console.log('🔑 API ключ найден');

const INDEX_NAME = 'triz-answers';
const pc = new Pinecone({ apiKey });

async function createIndex() {
  // Проверяем, существует ли индекс
  const indexes = await pc.listIndexes();
  const existing = indexes.indexes?.find(i => i.name === INDEX_NAME);

  if (existing) {
    // Проверяем, не integrated ли он (integrated embedding не принимает raw vectors)
    const desc = await pc.describeIndex(INDEX_NAME);
    const isIntegrated = desc.embed?.model;
    if (isIntegrated) {
      console.log(`⚠️ Индекс "${INDEX_NAME}" с integrated embedding. Удаляю и создаю заново...`);
      await pc.deleteIndex(INDEX_NAME);
      // Подождём пока удалится
      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.log(`✅ Индекс "${INDEX_NAME}" уже существует`);
      console.log(`   Host: ${existing.host}`);
      return existing.host;
    }
  }

  console.log(`🔨 Создаю индекс "${INDEX_NAME}" (dense, 1024, cosine)...`);

  await pc.createIndex({
    name: INDEX_NAME,
    vectorType: 'dense',
    dimension: 1024,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1'
      }
    }
  });

  console.log(`✅ Индекс создан!`);

  // Ждём пока индекс станет ready
  console.log('⏳ Жду готовности индекса...');
  let host = null;
  for (let i = 0; i < 60; i++) {
    const desc = await pc.describeIndex(INDEX_NAME);
    if (desc.status?.ready) {
      host = desc.host;
      console.log(`✅ Индекс готов! Host: ${host}`);
      break;
    }
    await new Promise(r => setTimeout(r, 2000));
    process.stdout.write('.');
  }

  if (!host) {
    console.error('\n❌ Индекс не стал ready за 2 минуты. Попробуйте запустить скрипт ещё раз.');
    process.exit(1);
  }

  return host;
}

async function uploadData(host) {
  const index = pc.index(INDEX_NAME, host);

  // Читаем паттерны
  const patterns = JSON.parse(readFileSync(join(__dirname, 'answer-patterns.json'), 'utf-8'));
  console.log(`\n📄 Загружено ${patterns.length} паттернов`);

  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(patterns.length / BATCH_SIZE);
  let uploaded = 0;

  for (let i = 0; i < patterns.length; i += BATCH_SIZE) {
    const batch = patterns.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`\n🔄 Батч ${batchNum}/${totalBatches} (${batch.length} записей)...`);

    // Получаем embeddings через Pinecone Inference API
    const texts = batch.map(p => p.text);
    let embeddings;
    try {
      const embeddingResponse = await pc.inference.embed(
        'multilingual-e5-large',
        texts,
        { inputType: 'passage' }
      );
      // SDK v7 может возвращать разные форматы
      if (Array.isArray(embeddingResponse)) {
        embeddings = embeddingResponse.map(item => item.values);
      } else if (embeddingResponse?.data) {
        embeddings = embeddingResponse.data.map(item => item.values);
      } else {
        // Попробуем как итератор
        embeddings = [...embeddingResponse].map(item => item.values);
      }
    } catch (embedErr) {
      console.error('Embed API error, trying REST fallback...');
      // Fallback: REST API напрямую
      const response = await fetch('https://api.pinecone.io/embed', {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
          'X-Pinecone-Api-Version': '2025-10'
        },
        body: JSON.stringify({
          model: 'multilingual-e5-large',
          inputs: texts.map(t => ({ text: t })),
          parameters: { input_type: 'passage', truncate: 'END' }
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Embed REST API failed: ${response.status} ${errText}`);
      }
      const result = await response.json();
      if (batchNum === 1) {
        console.log('REST response keys:', Object.keys(result));
        console.log('REST data length:', result.data?.length);
        if (result.data?.[0]) console.log('REST data[0] keys:', Object.keys(result.data[0]));
      }
      embeddings = result.data.map(item => item.values);
    }

    // Готовим векторы
    const vectors = batch.map((p, idx) => ({
      id: p.id,
      values: embeddings[idx],
      metadata: {
        taskId: p.taskId,
        branchId: p.branchId,
        matchType: p.matchType,
        text: p.text
      }
    }));

    // Загружаем через REST API (SDK v7 upsert имеет баг)
    const upsertResponse = await fetch(`https://${host}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vectors })
    });
    if (!upsertResponse.ok) {
      const errText = await upsertResponse.text();
      throw new Error(`Upsert failed: ${upsertResponse.status} ${errText}`);
    }
    uploaded += batch.length;
    console.log(`✅ Загружено ${uploaded}/${patterns.length}`);
  }

  console.log(`\n🎉 Готово! ${uploaded} векторов загружено в индекс "${INDEX_NAME}".`);

  // Сохраняем host в .env.local
  let envContent = '';
  try {
    envContent = readFileSync(envPath, 'utf-8');
  } catch (e) {}

  if (!envContent.includes('PINECONE_INDEX_HOST')) {
    const newEnv = envContent.trimEnd() + `\nPINECONE_INDEX_HOST=${host}\n`;
    const { writeFileSync } = await import('fs');
    writeFileSync(envPath, newEnv);
    console.log(`\n📝 Host сохранён в .env.local`);
  }

  // Проверка
  const stats = await index.describeIndexStats();
  console.log(`\n📊 Статистика индекса:`, JSON.stringify(stats, null, 2));
}

async function main() {
  console.log('\n🚀 Настройка Pinecone для ТРИЗ-бота\n');

  const host = await createIndex();
  await uploadData(host);

  console.log('\n✨ Всё готово! Можно деплоить на Vercel.');
  console.log('   Не забудьте добавить переменные окружения в Vercel Dashboard:');
  console.log(`   PINECONE_API_KEY = ${apiKey.slice(0, 8)}...`);
  console.log(`   PINECONE_INDEX_HOST = (сохранён в .env.local)`);
}

main().catch(err => {
  console.error('\n❌ Ошибка:', err.message);
  if (err.message.includes('401') || err.message.includes('Unauthorized')) {
    console.error('   Проверьте API ключ в .env.local');
  }
  process.exit(1);
});
