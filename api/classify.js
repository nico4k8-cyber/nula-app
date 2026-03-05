const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST;

async function embedText(text) {
  const response = await fetch('https://api.pinecone.io/embed', {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
      'X-Pinecone-Api-Version': '2025-10'
    },
    body: JSON.stringify({
      model: 'multilingual-e5-large',
      inputs: [{ text }],
      parameters: { input_type: 'query', truncate: 'END' }
    })
  });
  if (!response.ok) {
    throw new Error(`Embed failed: ${response.status}`);
  }
  const result = await response.json();
  return result.data[0].values;
}

async function queryIndex(vector, filter, topK = 10) {
  const response = await fetch(`https://${PINECONE_INDEX_HOST}/query`, {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      vector,
      topK,
      includeMetadata: true,
      filter
    })
  });
  if (!response.ok) {
    throw new Error(`Query failed: ${response.status}`);
  }
  return response.json();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, taskId, found = [] } = req.body;

  if (!text || !taskId) {
    return res.status(400).json({ error: 'text and taskId are required' });
  }

  try {
    // 1. Embed the user's text
    const queryVector = await embedText(text);

    // 2. Build filter: match taskId OR _all (for give_up patterns)
    const filter = {
      taskId: { $in: [taskId, '_all'] }
    };

    // 3. Query Pinecone
    const queryResponse = await queryIndex(queryVector, filter);

    // 4. Filter out already found branches and format results
    const matches = (queryResponse.matches || [])
      .filter(m => !found.includes(m.metadata.branchId))
      .map(m => ({
        branchId: m.metadata.branchId,
        matchType: m.metadata.matchType,
        score: Math.round(m.score * 1000) / 1000,
        text: m.metadata.text
      }));

    return res.status(200).json({ matches });
  } catch (err) {
    console.error('Pinecone error:', err.message);
    return res.status(500).json({ error: 'Pinecone query failed' });
  }
}
